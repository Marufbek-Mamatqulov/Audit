from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Permission


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User admin"""
    
    list_display = (
        'email', 'username', 'first_name', 'last_name', 
        'role', 'department', 'is_active', 'created_at'
    )
    list_filter = ('role', 'is_active', 'department', 'created_at')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-created_at',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('role', 'phone', 'department')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('email', 'first_name', 'last_name', 'role', 'phone', 'department')
        }),
    )


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    """Permission admin"""
    
    list_display = (
        'user', 'file', 'permission_type', 'granted_by', 'created_at'
    )
    list_filter = ('permission_type', 'created_at')
    search_fields = ('user__email', 'file__name', 'granted_by__email')
    ordering = ('-created_at',)
    
    readonly_fields = ('created_at',)
