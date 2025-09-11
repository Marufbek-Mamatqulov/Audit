import os
import json
import jwt
import hashlib
import requests
import uuid
from datetime import datetime, timedelta
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from .models import File, FileVersion, FilePermission, OnlyOfficeSession
from .serializers import (
    FileSerializer,
    FileUploadSerializer,
    FileUpdateSerializer,
    FileVersionSerializer,
    OnlyOfficeConfigSerializer,
    FileLockSerializer,
    FileSearchSerializer
)


class FileListCreateView(generics.ListCreateAPIView):
    """List and create files"""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        
        # Base queryset
        queryset = File.objects.select_related('department', 'uploaded_by').prefetch_related('file_permissions')
        
        # Filter based on user permissions
        if user.role == 'admin':
            # Admin can see all files
            pass
        elif user.role == 'manager' and user.department:
            # Managers can see department files and files they have permissions for
            dept_files = Q(department=user.department)
            subdept_files = Q(department__parent=user.department) if hasattr(user.department, 'parent') else Q()
            own_files = Q(uploaded_by=user)
            permission_files = Q(file_permissions__user=user)
            queryset = queryset.filter(
                dept_files | subdept_files | own_files | permission_files
            ).distinct()
        else:
            # Regular users can only see their own files and files they have permissions for
            own_files = Q(uploaded_by=user)
            permission_files = Q(file_permissions__user=user)
            dept_files = Q(department=user.department) if user.department else Q()
            queryset = queryset.filter(
                own_files | permission_files | dept_files
            ).distinct()
        
        # Apply search filters if provided
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(uploaded_by__first_name__icontains=search) |
                Q(uploaded_by__last_name__icontains=search)
            )
        
        department_id = self.request.query_params.get('department', '')
        if department_id:
            queryset = queryset.filter(department_id=department_id)
            
        file_type = self.request.query_params.get('type', '')
        if file_type:
            queryset = queryset.filter(file_type=file_type)
            
        status_filter = self.request.query_params.get('status', '')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return FileUploadSerializer
        return FileSerializer

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class FileDetailView(generics.RetrieveUpdateDestroyAPIView):
    """File detail view"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return File.objects.all()
        
        # Users can access files they own or have permissions to
        own_files = Q(uploaded_by=user)
        permission_files = Q(permissions__user=user)
        return File.objects.filter(own_files | permission_files)

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return FileUpdateSerializer
        return FileSerializer

    def perform_update(self, serializer):
        file_obj = self.get_object()
        user = self.request.user
        
        # Check if user can edit
        if not file_obj.can_edit(user):
            raise permissions.PermissionDenied("You don't have permission to edit this file.")
        
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        
        # Only file owner or admin can delete
        if instance.uploaded_by != user and user.role != 'admin':
            raise permissions.PermissionDenied("You can only delete files you uploaded.")
        
        instance.delete()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_file_version(request, pk):
    """Upload a new version of an existing file"""
    file_obj = get_object_or_404(File, pk=pk)
    user = request.user
    
    # Check permissions
    if not file_obj.can_edit(user):
        return Response(
            {'error': 'You don\'t have permission to edit this file.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create new version
    new_version = file_obj.version + 1
    FileVersion.objects.create(
        file=file_obj,
        version_number=new_version,
        file_data=request.FILES['file'],
        created_by=user,
        comment=request.data.get('comment', '')
    )
    
    # Update main file
    file_obj.file = request.FILES['file']
    file_obj.version = new_version
    file_obj.save()
    
    return Response({
        'message': 'New file version uploaded successfully',
        'version': new_version
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def file_versions(request, pk):
    """Get file version history"""
    file_obj = get_object_or_404(File, pk=pk)
    user = request.user
    
    # Check permissions
    if not file_obj.can_view(user):
        return Response(
            {'error': 'You don\'t have permission to view this file.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    versions = file_obj.versions.all()
    serializer = FileVersionSerializer(versions, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_file_lock(request, pk):
    """Lock or unlock a file"""
    file_obj = get_object_or_404(File, pk=pk)
    user = request.user
    
    serializer = FileLockSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    action = serializer.validated_data['action']
    
    if action == 'lock':
        if file_obj.is_locked and file_obj.locked_by != user:
            return Response(
                {'error': f'File is already locked by {file_obj.locked_by.full_name}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not file_obj.can_edit(user):
            return Response(
                {'error': 'You don\'t have permission to lock this file.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        file_obj.is_locked = True
        file_obj.locked_by = user
        file_obj.lock_time = timezone.now()
        file_obj.save()
        
        return Response({'message': 'File locked successfully'})
    
    else:  # unlock
        if not file_obj.is_locked:
            return Response(
                {'error': 'File is not locked'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if file_obj.locked_by != user and user.role != 'admin':
            return Response(
                {'error': 'You can only unlock files you have locked'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        file_obj.is_locked = False
        file_obj.locked_by = None
        file_obj.lock_time = None
        file_obj.save()
        
        return Response({'message': 'File unlocked successfully'})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def onlyoffice_config(request, pk):
    """Generate OnlyOffice configuration for file editing"""
    file_obj = get_object_or_404(File, pk=pk)
    user = request.user
    
    # Check if user can view the file
    if not file_obj.can_view(user):
        return Response(
            {'error': 'You don\'t have permission to view this file.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if file is suitable for OnlyOffice
    if file_obj.file_type not in ['excel', 'word']:
        return Response(
            {'error': 'File type not supported for online editing'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Generate document key (unique identifier for the document)
    document_key = hashlib.md5(
        f"{file_obj.id}_{file_obj.updated_at}_{user.id}".encode()
    ).hexdigest()
    
    # Determine document type
    doc_type = 'spreadsheet' if file_obj.file_type == 'excel' else 'text'
    
    # Build file URL
    file_url = request.build_absolute_uri(file_obj.get_file_url())
    
    # Build callback URL for saving changes
    callback_url = request.build_absolute_uri(
        f'/api/files/{pk}/onlyoffice-callback/'
    )
    
    # Determine permissions
    can_edit = file_obj.can_edit(user) and not file_obj.is_locked
    
    config = {
        'document': {
            'fileType': file_obj.file.name.split('.')[-1],
            'key': document_key,
            'title': file_obj.name,
            'url': file_url,
            'permissions': {
                'comment': can_edit,
                'download': True,
                'edit': can_edit,
                'fillForms': can_edit,
                'modifyFilter': can_edit,
                'modifyContentControl': can_edit,
                'review': can_edit
            }
        },
        'documentType': doc_type,
        'editorConfig': {
            'mode': 'edit' if can_edit else 'view',
            'lang': 'en',
            'callbackUrl': callback_url,
            'user': {
                'id': str(user.id),
                'name': user.full_name,
                'email': user.email
            },
            'customization': {
                'about': False,
                'feedback': False,
                'goback': {
                    'url': request.build_absolute_uri('/dashboard/')
                }
            }
        },
        'type': 'desktop',
        'width': '100%',
        'height': '100%'
    }
    
    # Sign the config with JWT if secret is configured
    if hasattr(settings, 'ONLYOFFICE_JWT_SECRET') and settings.ONLYOFFICE_JWT_SECRET:
        payload = {
            'iss': 'audit_system',
            'aud': 'onlyoffice',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=1),
            'document': config['document'],
            'editorConfig': config['editorConfig']
        }
        
        token = jwt.encode(payload, settings.ONLYOFFICE_JWT_SECRET, algorithm='HS256')
        config['token'] = token
    
    return Response(config)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # OnlyOffice callback doesn't send auth headers
def onlyoffice_callback(request, pk):
    """Handle OnlyOffice callback for saving document changes"""
    try:
        data = json.loads(request.body)
        status_code = data.get('status', 0)
        
        file_obj = get_object_or_404(File, pk=pk)
        
        # Status 2 means document is ready for saving
        if status_code == 2:
            download_url = data.get('url')
            if download_url:
                # Download the updated document
                response = requests.get(download_url)
                if response.status_code == 200:
                    # Save the updated file
                    file_obj.file.save(
                        file_obj.file.name,
                        response.content,
                        save=True
                    )
                    
                    # Create new version
                    file_obj.version += 1
                    file_obj.save()
                    
                    # Unlock the file if it was locked
                    if file_obj.is_locked:
                        file_obj.is_locked = False
                        file_obj.locked_by = None
                        file_obj.lock_time = None
                        file_obj.save()
        
        return JsonResponse({'error': 0})
    
    except Exception as e:
        return JsonResponse({'error': 1, 'message': str(e)})


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_files(request):
    """Get current user's files"""
    user = request.user
    files = File.objects.filter(uploaded_by=user)
    
    # Apply filters
    search_query = request.query_params.get('search', None)
    if search_query:
        files = files.filter(
            Q(name__icontains=search_query) |
            Q(description__icontains=search_query)
        )
    
    serializer = FileSerializer(files, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def shared_files(request):
    """Get files shared with current user"""
    user = request.user
    files = File.objects.filter(file_permissions__user=user)
    
    serializer = FileSerializer(files, many=True, context={'request': request})
    return Response(serializer.data)


# OnlyOffice Integration Views
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def onlyoffice_config(request, file_id):
    """Generate OnlyOffice configuration for file editing/viewing"""
    file_obj = get_object_or_404(File, id=file_id)
    user = request.user
    
    # Check permissions
    can_edit = file_obj.can_edit(user)
    can_view = file_obj.can_view(user)
    
    if not (can_edit or can_view):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Generate unique document key and session key
    document_key = str(uuid.uuid4())
    session_key = str(uuid.uuid4())
    
    # Create or update OnlyOffice session
    session, created = OnlyOfficeSession.objects.get_or_create(
        file=file_obj,
        user=user,
        defaults={
            'session_key': session_key,
            'document_key': document_key,
            'is_editor': can_edit,
            'is_active': True
        }
    )
    
    if not created:
        session.document_key = document_key
        session.session_key = session_key
        session.is_editor = can_edit
        session.is_active = True
        session.save()
    
    # Build absolute URLs
    file_url = request.build_absolute_uri(file_obj.file.url)
    callback_url = request.build_absolute_uri(f'/api/files/{file_id}/onlyoffice-callback/')
    
    config = {
        'document': {
            'fileType': file_obj.file.name.split('.')[-1].lower(),
            'key': document_key,
            'title': file_obj.name,
            'url': file_url,
            'permissions': {
                'comment': can_edit,
                'copy': can_view,
                'download': can_view,
                'edit': can_edit,
                'fillForms': can_edit,
                'modifyFilter': can_edit,
                'modifyContentControl': can_edit,
                'print': can_view,
                'review': can_edit
            }
        },
        'documentType': 'cell' if file_obj.file_type == 'excel' else 'word',
        'editorConfig': {
            'callbackUrl': callback_url,
            'lang': 'uz',
            'mode': 'edit' if can_edit else 'view',
            'user': {
                'id': str(user.id),
                'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                'group': user.department.name if user.department else 'Default'
            },
            'customization': {
                'about': True,
                'comments': can_edit,
                'feedback': False,
                'forcesave': True,
                'submitForm': can_edit
            }
        },
        'height': '600px',
        'width': '100%'
    }
    
    return Response(config)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def onlyoffice_callback(request, file_id):
    """OnlyOffice callback endpoint for handling document changes"""
    file_obj = get_object_or_404(File, id=file_id)
    data = request.data
    
    status_code = data.get('status')
    
    if status_code == 2:  # Document ready for saving
        download_url = data.get('url')
        if download_url:
            # Download the updated file
            response = requests.get(download_url)
            if response.status_code == 200:
                # Create new version
                version = FileVersion.objects.create(
                    file=file_obj,
                    version_number=file_obj.version + 1,
                    created_by=request.user,
                    comment='OnlyOffice auto-save'
                )
                
                # Save new file content
                version.file_data.save(
                    file_obj.file.name,
                    response.content
                )
                
                # Update main file version
                file_obj.version += 1
                file_obj.save()
    
    elif status_code == 3:  # Document saving error
        return Response({'error': 1})
    
    elif status_code == 6:  # Document being edited
        pass
    
    elif status_code == 7:  # Document force saved
        pass
    
    return Response({'error': 0})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def grant_file_permission(request, file_id):
    """Grant permission to a user for a specific file"""
    file_obj = get_object_or_404(File, id=file_id)
    user = request.user
    
    # Only admin, file owner, or managers can grant permissions
    if not (user.role == 'admin' or file_obj.uploaded_by == user or user.role == 'manager'):
        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
    
    target_user_id = request.data.get('user_id')
    permission_type = request.data.get('permission_type', 'read')
    
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        target_user = User.objects.get(id=target_user_id)
        
        permission, created = FilePermission.objects.get_or_create(
            file=file_obj,
            user=target_user,
            defaults={
                'permission_type': permission_type,
                'granted_by': user
            }
        )
        
        if not created:
            permission.permission_type = permission_type
            permission.granted_by = user
            permission.save()
        
        return Response({
            'message': 'Permission granted successfully',
            'permission': {
                'user': target_user.username,
                'permission_type': permission_type
            }
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def file_permissions_list(request):
    """List and create file permissions"""
    if request.method == 'GET':
        # Only admins can view all permissions
        if request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        permissions_qs = FilePermission.objects.select_related(
            'user', 'file', 'granted_by'
        ).all()
        
        permissions_data = []
        for perm in permissions_qs:
            permissions_data.append({
                'id': perm.id,
                'user': {
                    'id': perm.user.id,
                    'username': perm.user.username,
                    'first_name': perm.user.first_name,
                    'last_name': perm.user.last_name,
                    'email': perm.user.email,
                },
                'file': {
                    'id': perm.file.id,
                    'name': perm.file.name,
                },
                'permission_type': perm.permission_type,
                'granted_by': {
                    'id': perm.granted_by.id,
                    'username': perm.granted_by.username,
                },
                'granted_at': perm.granted_at
            })
        
        return Response(permissions_data)
    
    elif request.method == 'POST':
        # Only admins can create permissions
        if request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user_id = request.data.get('user_id')
            file_id = request.data.get('file_id')
            permission_type = request.data.get('permission_type')
            
            if not all([user_id, file_id, permission_type]):
                return Response({'error': 'user_id, file_id and permission_type are required'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Check if permission already exists
            existing = FilePermission.objects.filter(
                user_id=user_id, 
                file_id=file_id
            ).first()
            
            if existing:
                # Update existing permission
                existing.permission_type = permission_type
                existing.granted_by = request.user
                existing.save()
                permission = existing
            else:
                # Create new permission
                permission = FilePermission.objects.create(
                    user_id=user_id,
                    file_id=file_id,
                    permission_type=permission_type,
                    granted_by=request.user
                )
            
            return Response({
                'id': permission.id,
                'user': {
                    'id': permission.user.id,
                    'username': permission.user.username,
                    'first_name': permission.user.first_name,
                    'last_name': permission.user.last_name,
                    'email': permission.user.email,
                },
                'file': {
                    'id': permission.file.id,
                    'name': permission.file.name,
                },
                'permission_type': permission.permission_type,
                'granted_by': {
                    'id': permission.granted_by.id,
                    'username': permission.granted_by.username,
                },
                'granted_at': permission.granted_at
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def file_permission_delete(request, pk):
    """Delete a file permission"""
    if request.user.role != 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        permission = get_object_or_404(FilePermission, id=pk)
        permission.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# OnlyOffice Editor va Viewer Views
from django.shortcuts import render

def file_editor_view(request, pk):
    """OnlyOffice Editor sahifasi"""
    file_obj = get_object_or_404(File, pk=pk)
    
    # Foydalanuvchi huquqlarini tekshirish
    if not file_obj.can_edit(request.user):
        return render(request, 'files/error.html', {
            'error': 'Sizda bu faylni tahrirlash huquqi yo\'q.',
            'file': file_obj
        })
    
    # Faqat Excel fayllarini tahrirlash
    if file_obj.file_type != 'excel':
        return render(request, 'files/error.html', {
            'error': 'Faqat Excel fayllarini tahrirlash mumkin.',
            'file': file_obj
        })
    
    return render(request, 'files/editor.html', {
        'file': file_obj,
        'user': request.user
    })


def file_viewer_view(request, pk):
    """OnlyOffice Viewer sahifasi"""
    file_obj = get_object_or_404(File, pk=pk)
    
    # Foydalanuvchi huquqlarini tekshirish
    if not file_obj.can_view(request.user):
        return render(request, 'files/error.html', {
            'error': 'Sizda bu faylni ko\'rish huquqi yo\'q.',
            'file': file_obj
        })
    
    # Tahrirlash huquqi bormi tekshirish
    can_edit = file_obj.can_edit(request.user) and file_obj.file_type == 'excel'
    
    return render(request, 'files/viewer.html', {
        'file': file_obj,
        'user': request.user,
        'can_edit': can_edit
    })
