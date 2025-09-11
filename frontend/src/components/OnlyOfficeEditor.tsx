import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';

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
      script.src = 'http://localhost/web-apps/apps/api/documents/api.js';
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

      const response = await fetch(`http://localhost:8000/api/files/${fileId}/onlyoffice-config/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('Fayl konfiguratsiyasini olishda xato');
      }

      const config = await response.json();

      const editorConfig = {
        ...config,
        width: "100%",
        height: "100%",
        documentType: getDocumentType(fileName),
        document: {
          ...config.document,
          title: fileName,
        },
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
            macros: false,
            trackChanges: false,
            chat: false,
            comments: true,
            zoom: 100,
            compactToolbar: false,
            leftMenu: true,
            rightMenu: false,
            toolbar: true,
            statusBar: true,
            autosave: true,
            forcesave: true,
            commentAuthorOnly: false,
            showReviewChanges: false
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
        return 'cell';
      case 'docx':
      case 'doc':
        return 'word';
      case 'pptx':
      case 'ppt':
        return 'slide';
      default:
        return 'word';
    }
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

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ 
        height: '60px', 
        backgroundColor: '#2c3e50', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>📊 Excel Editor</h3>
          <span style={{ 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            padding: '4px 12px', 
            borderRadius: '15px',
            fontSize: '14px'
          }}>
            {fileName}
          </span>
        </div>
        <button
          onClick={handleCloseClick}
          style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ✕ Yopish
        </button>
      </div>

      {/* Editor Container */}
      <div style={{ height: 'calc(100vh - 60px)', position: 'relative' }}>
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
      </div>
    </div>
  );
};

export default OnlyOfficeEditor;
