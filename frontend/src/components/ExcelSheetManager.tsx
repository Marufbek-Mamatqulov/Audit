import React, { useState, useEffect } from 'react';

interface ExcelSheetManagerProps {
  documentEditor: any; // OnlyOffice document editor instance
  fileId: number;
  fileName: string;
}

interface SheetInfo {
  name: string;
  index: number;
  isActive: boolean;
}

const ExcelSheetManager: React.FC<ExcelSheetManagerProps> = ({ 
  documentEditor, 
  fileId,
  fileName 
}) => {
  const [sheets, setSheets] = useState<SheetInfo[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);
  const [sheetCount, setSheetCount] = useState<number>(1);

  // Function to fetch sheet information from the editor
  const updateSheetInfo = () => {
    if (!documentEditor) return;
    
    try {
      // OnlyOffice API to get sheet information
      const info = documentEditor.getSheets();
      if (info && info.length) {
        const sheetInfo = info.map((sheet: any, index: number) => ({
          name: sheet.name,
          index,
          isActive: sheet.active
        }));
        
        setSheets(sheetInfo);
        setSheetCount(sheetInfo.length);
        
        // Find active sheet
        const activeSheet = sheetInfo.find((s: SheetInfo) => s.isActive);
        if (activeSheet) {
          setActiveSheetIndex(activeSheet.index);
        }

        // Save last active sheet to backend
        saveSheetInfo(sheetInfo);
      }
    } catch (error) {
      console.error('Error getting sheet information:', error);
    }
  };

  // Function to save sheet information to backend
  const saveSheetInfo = async (sheetInfo: SheetInfo[]) => {
    try {
      const activeSheet = sheetInfo.find(s => s.isActive);
      
      const response = await fetch(`/api/files/${fileId}/update-sheet-info/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          sheet_count: sheetInfo.length,
          has_multiple_sheets: sheetInfo.length > 1,
          last_active_sheet: activeSheet?.name || sheetInfo[0]?.name
        })
      });
      
      if (!response.ok) {
        console.error('Failed to save sheet info:', await response.text());
      }
    } catch (error) {
      console.error('Error saving sheet information:', error);
    }
  };

  // Switch to a different sheet
  const switchSheet = (index: number) => {
    if (!documentEditor) return;
    
    try {
      documentEditor.setActiveSheet(index);
      setActiveSheetIndex(index);
      updateSheetInfo();
    } catch (error) {
      console.error('Error switching sheets:', error);
    }
  };

  // Add a new sheet
  const addSheet = () => {
    if (!documentEditor) return;
    
    try {
      const newSheetName = `Sheet${sheetCount + 1}`;
      documentEditor.addSheet(newSheetName);
      updateSheetInfo();
    } catch (error) {
      console.error('Error adding sheet:', error);
    }
  };

  // Subscribe to sheet change events
  useEffect(() => {
    if (!documentEditor) return;

    try {
      // Subscribe to sheet changes
      documentEditor.attachEvent('onActiveSheetChanged', updateSheetInfo);
      documentEditor.attachEvent('onWorksheetAdded', updateSheetInfo);
      documentEditor.attachEvent('onWorksheetRemoved', updateSheetInfo);
      documentEditor.attachEvent('onWorksheetRenamed', updateSheetInfo);

      // Initial sheet info
      updateSheetInfo();

      return () => {
        // Cleanup event listeners
        documentEditor.detachEvent('onActiveSheetChanged', updateSheetInfo);
        documentEditor.detachEvent('onWorksheetAdded', updateSheetInfo);
        documentEditor.detachEvent('onWorksheetRemoved', updateSheetInfo);
        documentEditor.detachEvent('onWorksheetRenamed', updateSheetInfo);
      };
    } catch (error) {
      console.error('Error setting up sheet event listeners:', error);
    }
  }, [documentEditor]);

  if (sheets.length <= 1) return null;

  return (
    <div 
      className="excel-sheet-manager"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f1f1f1',
        borderTop: '1px solid #d1d1d1',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        overflowX: 'auto',
        zIndex: 1000
      }}
    >
      {sheets.map((sheet, index) => (
        <div
          key={index}
          onClick={() => switchSheet(index)}
          style={{
            padding: '3px 10px',
            cursor: 'pointer',
            backgroundColor: sheet.isActive ? '#fff' : 'transparent',
            border: sheet.isActive ? '1px solid #d1d1d1' : 'none',
            borderBottom: 'none',
            borderTopLeftRadius: '3px',
            borderTopRightRadius: '3px',
            marginRight: '2px',
            fontSize: '12px',
            height: '22px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {sheet.name}
        </div>
      ))}
      <button
        onClick={addSheet}
        style={{
          marginLeft: '4px',
          padding: '0 5px',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px'
        }}
        title="Add Sheet"
      >
        +
      </button>
    </div>
  );
};

export default ExcelSheetManager;