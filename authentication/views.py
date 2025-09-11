from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import models
from .models import User, Permission
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    UserUpdateSerializer,
    PasswordChangeSerializer,
    PermissionSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT login view"""
    serializer_class = CustomTokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    """User registration view"""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """User profile view"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserUpdateSerializer
        return UserSerializer


class UserListCreateView(generics.ListCreateAPIView):
    """List and create users"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserRegistrationSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all()
        elif user.role == 'manager' and user.department:
            # Managers can see users in their department
            return user.department.get_all_users()
        else:
            # Regular users can only see themselves
            return User.objects.filter(id=user.id)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """User detail view"""
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all()
        elif user.role == 'manager' and user.department:
            return user.department.get_all_users()
        else:
            return User.objects.filter(id=user.id)

    def perform_update(self, serializer):
        # Only admin can change role and department
        user = self.request.user
        if user.role != 'admin':
            # Remove role and department from validated_data if not admin
            serializer.validated_data.pop('role', None)
            serializer.validated_data.pop('department', None)
        serializer.save()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password"""
    serializer = PasswordChangeSerializer(
        data=request.data, 
        context={'request': request}
    )
    
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """Logout user by blacklisting the refresh token"""
    try:
        refresh_token = request.data.get('refresh_token') or request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)
        else:
            # Agar refresh token yo'q bo'lsa ham success qaytaramiz
            return Response({
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)
    except Exception as e:
        # Token invalid bo'lsa ham success qaytaramiz
        return Response({
            'message': 'Successfully logged out'
        }, status=status.HTTP_200_OK)


class PermissionListCreateView(generics.ListCreateAPIView):
    """List and create permissions"""
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Permission.objects.all()
        else:
            # Users can see permissions for files they own or have access to
            return Permission.objects.filter(
                models.Q(file__uploaded_by=user) |
                models.Q(user=user)
            )

    def perform_create(self, serializer):
        serializer.save(granted_by=self.request.user)


class PermissionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Permission detail view"""
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Permission.objects.all()
        else:
            return Permission.objects.filter(
                models.Q(file__uploaded_by=user) |
                models.Q(granted_by=user)
            )
