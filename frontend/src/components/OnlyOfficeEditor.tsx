import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import ExcelSheetManager from './ExcelSheetManager';

interface OnlyOfficeEditorProps {
  fileId?: number;
  fileName?: string;
  onClose?: () => void;
}

declare global {
  interface Window {
    DocsAPI: any;
    docEditor: any;
  }
}

const OnlyOfficeEditor: React.FC<OnlyOfficeEditorProps> = ({ 
  fileId: propFileId, 
  fileName: propFileName, 
  onClose: propOnClose 
}) => {
  const { fileId: routeFileId } = useParams<{ fileId: string }>();
  const navigate = useNavigate();
  
  const fileId = propFileId || (routeFileId ? parseInt(routeFileId) : 0);
  const fileName = propFileName || 'Document.xlsx';
  const onClose = propOnClose || (() => navigate(-1));

  const user = useAppSelector((state) => state.auth.user);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const loadOnlyOfficeScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.DocsAPI) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      const onlyOfficeUrl = process.env.REACT_APP_ONLYOFFICE_URL || 'http://localhost/web-apps/apps/api/documents/api.js';
      script.src = onlyOfficeUrl;
      script.onload = () => {
        setIsScriptLoaded(true);
        resolve();
      };
      script.onerror = () => {
        setError('OnlyOffice Server ga ulanib bo\'lmadi. Serverni tekshiring.');
        reject(new Error('OnlyOffice script loading failed'));
      };
      document.head.appendChild(script);
    });
  };

  useEffect(() => {
    loadOnlyOfficeScript().catch(console.error);
  }, [fileId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initializeEditor = useCallback(async () => {
    try {
      if (!window.DocsAPI || !fileId || !user) return;

      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/files/${fileId}/onlyoffice-config/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Fayl konfiguratsiyasini olishda xato');
      }

      const config = await response.json();
      
      // Log for debugging
      console.log('File configuration received:', config);

      // Get the document type for the file
      const documentType = getDocumentType(fileName);
      // Get type-specific configuration
      const typeConfig = getTypeSpecificConfig(documentType);
      
      const editorConfig = {
        ...config,
        width: "100%",
        height: "100%",
        documentType: documentType,
        document: {
          ...config.document,
          title: fileName,
        },
        ...typeConfig, // Add document type-specific configuration
        editorConfig: {
          ...config.editorConfig,
          lang: 'uz',
          customization: {
            about: false,
            feedback: false,
            goback: {
              url: '#',
              text: 'Orqaga'
            },
            logo: {
              image: '',
              imageEmbedded: '',
              url: '#'
            },
            customer: {
              name: 'Audit System',
              address: 'Tashkent, Uzbekistan',
              mail: 'info@auditsystem.uz',
              www: 'auditsystem.uz'
            },
            features: {
              spellcheck: {
                mode: true
              }
            },
            plugins: true,
            macros: true, // Enable macros for Excel functionality
            trackChanges: true, // Enable track changes
            chat: true, // Enable chat for collaborative editing
            comments: true,
            zoom: 100,
            compactToolbar: false,
            leftMenu: true,
            rightMenu: true, // Enable right menu for cell properties
            toolbar: true,
            statusBar: true,
            autosave: true,
            forcesave: true,
            commentAuthorOnly: false,
            showReviewChanges: true,
            /**
             * Excel-specific customization for enhanced experience
             */
            sheets: {
              show: true, // Always show sheets tab bar
              limit: 100  // Support up to 100 sheets
            },
            formulaEditor: {
              enabled: true, // Enable advanced formula editing
            },
            layout: {
              functionalTab: {
                visible: true // Show Excel functional tabs
              }
            }
          },
          user: {
            id: user.id?.toString(),
            name: user.username,
            group: user.role || 'user'
          },
          recent: [],
          templates: []
        },
        events: {
          'onAppReady': () => {
            console.log('OnlyOffice muvaffaqiyatli yuklandi');
            setIsLoading(false);
          },
          'onDocumentReady': () => {
            console.log('Hujjat tayyor');
            setIsLoading(false);
          },
          'onRequestClose': () => {
            console.log('Editor yopilmoqda');
            if (onClose) onClose();
          },
          'onError': (event: any) => {
            console.error('OnlyOffice xatosi:', event);
            setError(`OnlyOffice xatosi: ${event?.data || 'Noma\'lum xato'}`);
            setIsLoading(false);
          }
        }
      };

      if (documentContainerRef.current) {
        window.docEditor = new window.DocsAPI.DocEditor("onlyoffice-editor", editorConfig);
      }

    } catch (error) {
      console.error('Editor ni ishga tushirishda xato:', error);
      setError(error instanceof Error ? error.message : 'Noma\'lum xato');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId, user, fileName]); // onClose ni dependencies'dan o'chirdik

  useEffect(() => {
    if (isScriptLoaded && fileId && user) {
      initializeEditor();
    }

    return () => {
      if (window.docEditor) {
        try {
          window.docEditor.destroyEditor();
        } catch (error) {
          console.warn('Editor ni yopishda xato:', error);
        }
      }
    };
  }, [isScriptLoaded, fileId, user, initializeEditor]);

  const getDocumentType = (fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'xlsx':
      case 'xls':
      case 'csv':
      case 'ods':
      case 'numbers':
        return 'cell';
      case 'docx':
      case 'doc':
      case 'odt':
      case 'rtf':
      case 'txt':
        return 'word';
      case 'pptx':
      case 'ppt':
      case 'odp':
        return 'slide';
      default:
        return 'word';
    }
  };
  
  // Get Excel specific configuration based on document type
  const getTypeSpecificConfig = (documentType: string) => {
    if (documentType === 'cell') {
      return {
        cell: {
          // Excel-specific features
          enhancedFormatting: true, // Enable enhanced Excel formatting
          multipleSheets: true, // Support multiple sheets
          formulas: {
            advanced: true, // Advanced formula support
            autoComplete: true // Formula auto-completion
          },
          dataValidation: true, // Support data validation
          conditionalFormatting: true, // Support conditional formatting
          // Excel-specific UI settings
          ui: {
            showGridlines: true,
            showHeadings: true,
            showSheetTabs: true,
            maxSheets: 100, // Support up to 100 sheets
            enableFreezing: true, // Enable row/column freezing
            showFormulaBar: true,
          },
          // Full support for Excel formatting options
          formatting: {
            currencies: true, // Currency format support
            numberFormats: true, // Number format support
            textFormats: true, // Text format support
            colors: true, // Cell colors and formatting
            fonts: {
              all: true // Support all Excel fonts
            }
          }
        }
      };
    }
    return {};
  };

  const handleCloseClick = () => {
    if (window.docEditor) {
      try {
        window.docEditor.destroyEditor();
      } catch (error) {
        console.warn('Editor ni yopishda xato:', error);
      }
    }
    if (onClose) onClose();
  };

  const [isExcelFile, setIsExcelFile] = useState(fileName.toLowerCase().endsWith('.xlsx') || 
                                           fileName.toLowerCase().endsWith('.xls'));

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', backgroundColor: '#f8f9fa' }}>
      {/* Custom Excel-like header */}
      <div style={{ 
        height: '32px', 
        backgroundColor: '#217346', /* Excel green */
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 10px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 'bold' }}>
            {fileName} - Audit System Excel
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            onClick={handleCloseClick}
            style={{
              backgroundColor: 'transparent',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Yopish"
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* Excel-like menu bar */}
      <div style={{
        height: '24px',
        backgroundColor: '#f3f2f1',
        borderBottom: '1px solid #e1dfdd',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        fontSize: '12px'
      }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <span style={{ padding: '0 5px', cursor: 'default' }}>Файл</span>
          <span style={{ padding: '0 5px', cursor: 'default' }}>Главная</span>
          <span style={{ padding: '0 5px', cursor: 'default' }}>Вставка</span>
          <span style={{ padding: '0 5px', cursor: 'default' }}>Разметка страницы</span>
          <span style={{ padding: '0 5px', cursor: 'default' }}>Формулы</span>
          <span style={{ padding: '0 5px', cursor: 'default' }}>Данные</span>
          <span style={{ padding: '0 5px', cursor: 'default' }}>Рецензирование</span>
          <span style={{ padding: '0 5px', cursor: 'default' }}>Вид</span>
        </div>
      </div>

      {/* Editor Container */}
      <div style={{ height: 'calc(100vh - 56px)', position: 'relative' }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1000,
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
            <div style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '10px' }}>
              Excel fayli yuklanmoqda...
            </div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #ecf0f1',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {error && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1000,
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '2px solid #e74c3c'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <div style={{ fontSize: '18px', color: '#e74c3c', marginBottom: '15px' }}>
              Xato yuz berdi
            </div>
            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '20px' }}>
              {error}
            </div>
            <button
              onClick={handleCloseClick}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Orqaga qaytish
            </button>
          </div>
        )}

        <div 
          id="onlyoffice-editor" 
          ref={documentContainerRef}
          style={{ 
            width: '100%', 
            height: '100%',
            visibility: (isLoading || error) ? 'hidden' : 'visible'
          }}
        />
        
        {/* Excel Sheet Manager (visible only for Excel files) */}
        {isExcelFile && !isLoading && !error && window.docEditor && (
          <ExcelSheetManager 
            documentEditor={window.docEditor} 
            fileId={fileId}
            fileName={fileName}
          />
        )}
      </div>
    </div>
  );
};

export default OnlyOfficeEditor;
