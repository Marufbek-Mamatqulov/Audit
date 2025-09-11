import os
import uuid
from django.db import models
from django.conf import settings


def file_upload_path(instance, filename):
    """Generate upload path for files"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('uploads', str(instance.department.id) if instance.department else 'general', filename)


class FilePermission(models.Model):
    """File permission model for granular access control"""
    
    PERMISSION_CHOICES = [
        ('read', 'Read Only'),
        ('write', 'Read & Write'),
        ('admin', 'Full Access'),
    ]
    
    file = models.ForeignKey('File', on_delete=models.CASCADE, related_name='file_permissions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    permission_type = models.CharField(max_length=20, choices=PERMISSION_CHOICES)
    granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='granted_file_permissions'
    )
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('file', 'user')
        verbose_name = 'File Permission'
        verbose_name_plural = 'File Permissions'

    def __str__(self):
        return f"{self.user.username} - {self.file.name} ({self.permission_type})"


class OnlyOfficeSession(models.Model):
    """OnlyOffice editing session tracking"""
    
    file = models.ForeignKey('File', on_delete=models.CASCADE, related_name='editing_sessions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session_key = models.CharField(max_length=255, unique=True)
    document_key = models.CharField(max_length=255, unique=True)
    is_editor = models.BooleanField(default=False)  # True for edit, False for view
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'OnlyOffice Session'
        verbose_name_plural = 'OnlyOffice Sessions'
    
    def __str__(self):
        return f"{self.user.username} - {self.file.name} ({'Edit' if self.is_editor else 'View'})"


class File(models.Model):
    """File model for document management"""
    
    FILE_TYPE_CHOICES = [
        ('excel', 'Excel'),
        ('word', 'Word'),
        ('pdf', 'PDF'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('review', 'Under Review'),
        ('approved', 'Approved'),
        ('archived', 'Archived'),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    file = models.FileField(upload_to=file_upload_path)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Relationships
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_files'
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='files'
    )
    
    # Metadata
    file_size = models.BigIntegerField(default=0)  # in bytes
    version = models.PositiveIntegerField(default=1)
    is_locked = models.BooleanField(default=False)
    locked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='locked_files'
    )
    lock_time = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'File'
        verbose_name_plural = 'Files'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            # Determine file type based on extension
            ext = self.file.name.split('.')[-1].lower()
            if ext in ['xlsx', 'xls']:
                self.file_type = 'excel'
            elif ext in ['docx', 'doc']:
                self.file_type = 'word'
            elif ext == 'pdf':
                self.file_type = 'pdf'
            else:
                self.file_type = 'other'
        super().save(*args, **kwargs)

    def get_file_url(self):
        """Get the file URL"""
        if self.file:
            return self.file.url
        return None

    def can_edit(self, user):
        """Check if user can edit this file"""
        # Admin can edit all files
        if user.role == 'admin':
            return True
        
        # Owner can edit
        if self.uploaded_by == user:
            return True
            
        # Check permissions
        try:
            permission = self.file_permissions.get(user=user)
            return permission.permission_type in ['write', 'admin']
        except:
            return False

    def can_view(self, user):
        """Check if user can view this file"""
        # Admin can view all files
        if user.role == 'admin':
            return True
        
        # Owner can view
        if self.uploaded_by == user:
            return True
            
        # Check permissions
        try:
            permission = self.file_permissions.get(user=user)
            return permission.permission_type in ['read', 'write', 'admin']
        except:
            return False


class FileVersion(models.Model):
    """File version history"""
    
    file = models.ForeignKey(File, on_delete=models.CASCADE, related_name='versions')
    version_number = models.PositiveIntegerField()
    file_data = models.FileField(upload_to='versions/')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    comment = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('file', 'version_number')
        ordering = ['-version_number']

    def __str__(self):
        return f"{self.file.name} - v{self.version_number}"
