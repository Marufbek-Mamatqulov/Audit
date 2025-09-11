from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, Permission


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer"""
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['email'] = user.email
        token['role'] = user.role
        token['full_name'] = user.full_name
        token['department_id'] = user.department.id if user.department else None
        
        return token


class UserRegistrationSerializer(serializers.ModelSerializer):
    """User registration serializer"""
    
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'phone', 'department', 'role'
        )
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """User serializer for API responses"""
    
    full_name = serializers.ReadOnlyField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    department = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'phone', 'role', 'department', 'department_name',
            'is_active', 'date_joined'
        )
        read_only_fields = ('id', 'date_joined')
    
    def get_department(self, obj):
        if obj.department:
            return {
                'id': obj.department.id,
                'name': obj.department.name
            }
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """User update serializer"""
    
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'phone', 'department'
        )


class PasswordChangeSerializer(serializers.Serializer):
    """Password change serializer"""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class PermissionSerializer(serializers.ModelSerializer):
    """Permission serializer"""
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    file_name = serializers.CharField(source='file.name', read_only=True)
    granted_by_email = serializers.CharField(source='granted_by.email', read_only=True)
    
    class Meta:
        model = Permission
        fields = (
            'id', 'user', 'user_email', 'file', 'file_name',
            'permission_type', 'granted_by', 'granted_by_email', 'created_at'
        )
        read_only_fields = ('id', 'granted_by', 'created_at')
