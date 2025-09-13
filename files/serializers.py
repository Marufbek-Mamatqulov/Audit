from rest_framework import serializers
from .models import File, FileVersion, FilePermission, OnlyOfficeSession


class FilePermissionSerializer(serializers.ModelSerializer):
    """File permission serializer"""
    
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    granted_by_name = serializers.CharField(source='granted_by.get_full_name', read_only=True)
    
    class Meta:
        model = FilePermission
        fields = (
            'id', 'user', 'user_name', 'user_username', 'permission_type',
            'granted_by', 'granted_by_name', 'granted_at'
        )
        read_only_fields = ('id', 'granted_by', 'granted_at')


class FileSerializer(serializers.ModelSerializer):
    """File serializer"""
    
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    locked_by_name = serializers.CharField(source='locked_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_view = serializers.SerializerMethodField()
    permissions = FilePermissionSerializer(source='file_permissions', many=True, read_only=True)
    
    class Meta:
        model = File
        fields = (
            'id', 'name', 'description', 'file', 'file_url', 'file_type',
            'status', 'uploaded_by', 'uploaded_by_name', 'department',
            'department_name', 'file_size', 'file_size_mb', 'version',
            'is_locked', 'locked_by', 'locked_by_name', 'lock_time',
            'can_edit', 'can_view', 'permissions', 'created_at', 'updated_at',
            'onedrive_embed_url', 'is_onedrive_embed', 'onedrive_direct_link'
        )
        read_only_fields = (
            'id', 'uploaded_by', 'file_type', 'file_size', 'version',
            'is_locked', 'locked_by', 'lock_time', 'created_at', 'updated_at'
        )

    def get_file_url(self, obj):
        """Get file URL"""
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_file_size_mb(self, obj):
        """Get file size in MB"""
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return 0

    def get_can_edit(self, obj):
        """Check if current user can edit the file"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_edit(request.user)
        return False

    def get_can_view(self, obj):
        """Check if current user can view the file"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_view(request.user)
        return False


class FileUploadSerializer(serializers.ModelSerializer):
    """File upload serializer"""
    
    class Meta:
        model = File
        fields = ('name', 'description', 'file', 'department', 'status')

    def validate_file(self, value):
        """Validate file upload"""
        # Check file size (50MB limit)
        if value.size > 50 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 50MB.")
        
        # Check file extension
        allowed_extensions = [
            '.xlsx', '.xls', '.docx', '.doc', '.pdf',
            '.txt', '.csv', '.ppt', '.pptx'
        ]
        ext = value.name.lower().split('.')[-1]
        if f'.{ext}' not in allowed_extensions:
            raise serializers.ValidationError(
                f"File type '{ext}' is not allowed. "
                f"Allowed types: {', '.join(allowed_extensions)}"
            )
        
        return value


class FileUpdateSerializer(serializers.ModelSerializer):
    """File update serializer"""
    
    class Meta:
        model = File
        fields = ('name', 'description', 'status', 'department')


class FileVersionSerializer(serializers.ModelSerializer):
    """File version serializer"""
    
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    file_size = serializers.SerializerMethodField()
    
    class Meta:
        model = FileVersion
        fields = (
            'id', 'version_number', 'file_data', 'file_size',
            'created_by', 'created_by_name', 'created_at', 'comment'
        )
        read_only_fields = ('id', 'created_by', 'created_at')

    def get_file_size(self, obj):
        """Get file size"""
        if obj.file_data:
            return obj.file_data.size
        return 0


class OnlyOfficeConfigSerializer(serializers.Serializer):
    """OnlyOffice document configuration serializer"""
    
    document_type = serializers.CharField()
    document_key = serializers.CharField()
    document_url = serializers.URLField()
    document_title = serializers.CharField()
    callback_url = serializers.URLField()
    user_id = serializers.CharField()
    user_name = serializers.CharField()
    user_email = serializers.EmailField()
    permissions = serializers.DictField()
    

class FileLockSerializer(serializers.Serializer):
    """File lock/unlock serializer"""
    
    action = serializers.ChoiceField(choices=['lock', 'unlock'])
    
    
class FilePermissionSerializer(serializers.Serializer):
    """File permission check serializer"""
    
    user_id = serializers.IntegerField()
    permission_type = serializers.ChoiceField(choices=['read', 'write', 'admin'])


class OneDriveEmbedSerializer(serializers.ModelSerializer):
    """OneDrive embed file serializer"""
    
    class Meta:
        model = File
        fields = (
            'name', 'description', 'department', 'onedrive_direct_link', 'onedrive_embed_url'
        )
    
    def create(self, validated_data):
        """Create OneDrive embed file"""
        validated_data['is_onedrive_embed'] = True
        validated_data['file_type'] = 'excel'  # OneDrive embeds are typically Excel files
        
        # Handle empty department field
        if validated_data.get('department') == '':
            validated_data['department'] = None
        
        # Extract embed URL from direct link if not provided
        direct_link = validated_data.get('onedrive_direct_link', '')
        if direct_link and not validated_data.get('onedrive_embed_url'):
            validated_data['onedrive_embed_url'] = self.convert_to_embed_url(direct_link)
        
        return super().create(validated_data)
    
    def convert_to_embed_url(self, direct_link):
        """Convert OneDrive direct link to embed URL"""
        try:
            # Example conversion logic for OneDrive links
            # Replace /view?id= with embed parameters
            if '1drv.ms' in direct_link and '/x/' in direct_link:
                # Extract the file path from the URL
                import re
                match = re.search(r'1drv\.ms/x/([^/]+/[^/?]+)', direct_link)
                if match:
                    file_path = match.group(1)
                    return f"https://1drv.ms/x/{file_path}/IQQje0EkhUCVRpLwAmHhua0LAV5Pd1qxAIX_f7cOYxTg4yc?em=2&wdAllowInteractivity=True&wdHideGridlines=False&wdHideHeaders=False&wdDownloadButton=True&wdInConfigurator=True"
            return direct_link
        except:
            return direct_link


class FileSearchSerializer(serializers.Serializer):
    """File search serializer"""
    
    query = serializers.CharField(max_length=255, required=False)
    file_type = serializers.ChoiceField(
        choices=['excel', 'word', 'pdf', 'other'], 
        required=False
    )
    status = serializers.ChoiceField(
        choices=['draft', 'review', 'approved', 'archived'],
        required=False
    )
    department_id = serializers.IntegerField(required=False)
    date_from = serializers.DateTimeField(required=False)
    date_to = serializers.DateTimeField(required=False)
