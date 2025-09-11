from django.contrib import admin
from .models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    """Department admin"""
    
    list_display = (
        'name', 'manager', 'parent', 'is_active', 'created_at'
    )
    list_filter = ('is_active', 'parent', 'created_at')
    search_fields = ('name', 'description', 'manager__email')
    ordering = ('name',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'manager', 'parent', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def get_queryset(self, request):
        """Optimize queryset with related objects"""
        return super().get_queryset(request).select_related('manager', 'parent')
