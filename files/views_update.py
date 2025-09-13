# Add to files/views.py

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_sheet_info(request, file_id):
    """Update Excel sheet information"""
    file_obj = get_object_or_404(File, id=file_id)
    user = request.user
    
    # Check edit permission
    if not file_obj.can_edit(user):
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    # Update sheet information
    sheet_count = request.data.get('sheet_count', 1)
    has_multiple_sheets = request.data.get('has_multiple_sheets', False)
    last_active_sheet = request.data.get('last_active_sheet')
    
    file_obj.sheet_count = sheet_count
    file_obj.has_multiple_sheets = has_multiple_sheets
    if last_active_sheet:
        file_obj.last_active_sheet = last_active_sheet
    
    file_obj.save()
    
    return Response({
        'success': True,
        'sheet_count': file_obj.sheet_count,
        'has_multiple_sheets': file_obj.has_multiple_sheets,
        'last_active_sheet': file_obj.last_active_sheet
    })