from django.contrib import admin
from .models import File, FileVersion


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    """File admin"""
    
    list_display = (
        'name', 'file_type', 'status', 'uploaded_by', 
        'department', 'version', 'is_locked', 'created_at'
    )
    list_filter = ('file_type', 'status', 'is_locked', 'department', 'created_at')
    search_fields = ('name', 'description', 'uploaded_by__email')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'file', 'status')
        }),
        ('Metadata', {
            'fields': ('file_type', 'file_size', 'version')
        }),
        ('Relationships', {
            'fields': ('uploaded_by', 'department')
        }),
        ('Lock Status', {
            'fields': ('is_locked', 'locked_by', 'lock_time')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = (
        'file_type', 'file_size', 'version', 
        'created_at', 'updated_at'
    )
    
    def get_queryset(self, request):
        """Optimize queryset with related objects"""
        return super().get_queryset(request).select_related(
            'uploaded_by', 'department', 'locked_by'
        )


@admin.register(FileVersion)
class FileVersionAdmin(admin.ModelAdmin):
    """File version admin"""
    
    list_display = (
        'file', 'version_number', 'created_by', 'created_at'
    )
    list_filter = ('created_at',)
    search_fields = ('file__name', 'created_by__email', 'comment')
    ordering = ('-created_at',)
    
    readonly_fields = ('created_at',)
    
    def get_queryset(self, request):
        """Optimize queryset with related objects"""
        return super().get_queryset(request).select_related('file', 'created_by')
