import React, { useState, useEffect } from 'react';

interface OneDriveEmbedViewerProps {
  fileId: number;
  fileName: string;
  onClose: () => void;
}

const OneDriveEmbedViewer: React.FC<OneDriveEmbedViewerProps> = ({ 
  fileId, 
  fileName, 
  onClose 
}) => {
  const [embedData, setEmbedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmbedData();
  }, [fileId]);

  const fetchEmbedData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/files/${fileId}/onedrive-embed/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        }
      });

      if (!response.ok) {
        throw new Error('OneDrive embed ma\'lumotlarini olishda xato');
      }

      const data = await response.json();
      setEmbedData(data);
    } catch (error) {
      console.error('Error fetching embed data:', error);
      setError(error instanceof Error ? error.message : 'Noma\'lum xato');
    } finally {
      setLoading(false);
    }
  };

  const openDirectLink = () => {
    if (embedData?.direct_link) {
      window.open(embedData.direct_link, '_blank');
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ 
        height: '60px', 
        backgroundColor: '#0078d4', /* OneDrive blue */
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ fontSize: '24px' }}>📊</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px' }}>OneDrive Excel - {fileName}</h3>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
              Embedded from Microsoft OneDrive
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {embedData?.direct_link && (
            <button
              onClick={openDirectLink}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '8px 16px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🔗 OneDrive'da ochish
            </button>
          )}
          
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕ Yopish
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ height: 'calc(100vh - 60px)', position: 'relative' }}>
        {loading && (
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
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>☁️</div>
            <div style={{ fontSize: '18px', color: '#0078d4', marginBottom: '10px' }}>
              OneDrive Excel yuklanmoqda...
            </div>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #ecf0f1',
              borderTop: '4px solid #0078d4',
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
            border: '2px solid #dc3545'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
            <div style={{ fontSize: '18px', color: '#dc3545', marginBottom: '15px' }}>
              Xato yuz berdi
            </div>
            <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '20px' }}>
              {error}
            </div>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#0078d4',
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

        {embedData?.embed_url && !loading && !error && (
          <iframe
            src={embedData.embed_url}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: 'white'
            }}
            title={fileName}
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
};

export default OneDriveEmbedViewer;