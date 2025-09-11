from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Q
from .models import Department
from .serializers import (
    DepartmentSerializer,
    DepartmentCreateSerializer,
    DepartmentTreeSerializer,
    DepartmentStatsSerializer
)


class DepartmentListCreateView(generics.ListCreateAPIView):
    """List and create departments"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Department.objects.all()
        elif user.role == 'manager' and user.department:
            # Managers can see their department and subdepartments
            department = user.department
            return Department.objects.filter(
                Q(id=department.id) |
                Q(parent=department) |
                Q(parent__parent=department)
            )
        else:
            # Regular users can only see their own department
            return Department.objects.filter(id=user.department.id) if user.department else Department.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DepartmentCreateSerializer
        return DepartmentSerializer

    def perform_create(self, serializer):
        # Only admin and managers can create departments
        user = self.request.user
        if user.role not in ['admin', 'manager']:
            raise PermissionDenied("You don't have permission to create departments.")
        
        serializer.save()


class DepartmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Department detail view"""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Department.objects.all()
        elif user.role == 'manager':
            # Managers can manage their department and subdepartments
            if user.department:
                department = user.department
                return Department.objects.filter(
                    Q(id=department.id) |
                    Q(parent=department)
                )
        return Department.objects.filter(id=user.department.id) if user.department else Department.objects.none()

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return DepartmentCreateSerializer
        return DepartmentSerializer

    def perform_update(self, serializer):
        # Only admin and department managers can update
        user = self.request.user
        department = self.get_object()
        
        if user.role != 'admin' and department.manager != user:
            raise permissions.PermissionDenied("You can only update departments you manage.")
        
        serializer.save()

    def perform_destroy(self, instance):
        # Only admin can delete departments
        user = self.request.user
        if user.role != 'admin':
            raise permissions.PermissionDenied("Only administrators can delete departments.")
        
        # Check if department has users or subdepartments
        if instance.users.exists():
            raise ValueError("Cannot delete department with active users.")
        
        if instance.subdepartments.exists():
            raise ValueError("Cannot delete department with subdepartments.")
        
        instance.delete()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def department_tree(request):
    """Get department tree structure"""
    user = request.user
    
    if user.role == 'admin':
        # Admin can see full tree
        root_departments = Department.objects.filter(parent=None, is_active=True)
    elif user.role == 'manager' and user.department:
        # Managers see their department tree
        root_departments = Department.objects.filter(
            Q(id=user.department.id) |
            Q(parent=None, id=user.department.id)
        ).filter(is_active=True)
    else:
        # Regular users see only their department
        if user.department:
            root_departments = Department.objects.filter(id=user.department.id)
        else:
            root_departments = Department.objects.none()
    
    serializer = DepartmentTreeSerializer(root_departments, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def department_stats(request, pk=None):
    """Get department statistics"""
    user = request.user
    
    if pk:
        try:
            department = Department.objects.get(pk=pk)
            
            # Check permissions
            if user.role != 'admin' and user.department != department and department.manager != user:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = DepartmentStatsSerializer(department)
            return Response(serializer.data)
            
        except Department.DoesNotExist:
            return Response(
                {'error': 'Department not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    else:
        # Get stats for all accessible departments
        if user.role == 'admin':
            departments = Department.objects.filter(is_active=True)
        elif user.role == 'manager' and user.department:
            departments = Department.objects.filter(
                Q(id=user.department.id) |
                Q(parent=user.department)
            ).filter(is_active=True)
        else:
            departments = Department.objects.filter(
                id=user.department.id
            ) if user.department else Department.objects.none()
        
        serializer = DepartmentStatsSerializer(departments, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_department(request):
    """Get current user's department"""
    user = request.user
    
    if not user.department:
        return Response(
            {'error': 'User is not assigned to any department'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = DepartmentSerializer(user.department)
    return Response(serializer.data)
