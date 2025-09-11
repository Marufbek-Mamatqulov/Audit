from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    """Department serializer"""
    
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    full_path = serializers.ReadOnlyField()
    user_count = serializers.SerializerMethodField()
    subdepartment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = (
            'id', 'name', 'description', 'manager', 'manager_name',
            'parent', 'parent_name', 'full_path', 'is_active',
            'user_count', 'subdepartment_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_user_count(self, obj):
        """Get the number of users in this department"""
        return obj.users.count()

    def get_subdepartment_count(self, obj):
        """Get the number of subdepartments"""
        return obj.subdepartments.count()


class DepartmentCreateSerializer(serializers.ModelSerializer):
    """Department creation serializer"""
    
    class Meta:
        model = Department
        fields = ('name', 'description', 'manager', 'parent')

    def validate(self, attrs):
        # Prevent circular parent-child relationships
        parent = attrs.get('parent')
        if parent and self.instance:
            if parent == self.instance or parent in self.instance.get_all_subdepartments():
                raise serializers.ValidationError(
                    "Cannot set parent to self or subdepartment."
                )
        return attrs


class DepartmentTreeSerializer(serializers.ModelSerializer):
    """Department tree serializer for hierarchical display"""
    
    subdepartments = serializers.SerializerMethodField()
    manager_name = serializers.CharField(source='manager.full_name', read_only=True)
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = (
            'id', 'name', 'description', 'manager', 'manager_name',
            'user_count', 'subdepartments', 'is_active'
        )

    def get_subdepartments(self, obj):
        """Get subdepartments recursively"""
        subdepts = obj.subdepartments.filter(is_active=True)
        return DepartmentTreeSerializer(subdepts, many=True).data

    def get_user_count(self, obj):
        """Get the total number of users in this department and subdepartments"""
        return obj.get_all_users().count()


class DepartmentStatsSerializer(serializers.ModelSerializer):
    """Department statistics serializer"""
    
    total_users = serializers.SerializerMethodField()
    active_users = serializers.SerializerMethodField()
    total_files = serializers.SerializerMethodField()
    recent_files = serializers.SerializerMethodField()
    subdepartment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = (
            'id', 'name', 'total_users', 'active_users',
            'total_files', 'recent_files', 'subdepartment_count'
        )

    def get_total_users(self, obj):
        return obj.get_all_users().count()

    def get_active_users(self, obj):
        return obj.get_all_users().filter(is_active=True).count()

    def get_total_files(self, obj):
        return obj.files.count()

    def get_recent_files(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        last_week = timezone.now() - timedelta(days=7)
        return obj.files.filter(created_at__gte=last_week).count()

    def get_subdepartment_count(self, obj):
        return obj.get_all_subdepartments().count()
