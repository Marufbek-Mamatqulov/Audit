import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchFiles } from '../store/slices/fileSlice';

const FileDebugger: React.FC = () => {
  const dispatch = useAppDispatch();
  const fileState = useAppSelector((state: any) => state.file);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    const testFetch = async () => {
      try {
        setDebugInfo('Dispatching fetchFiles...');
        const result = await dispatch(fetchFiles()).unwrap();
        setDebugInfo(`Success: Got ${Array.isArray(result) ? result.length : 'non-array'} files`);
      } catch (error: any) {
        setDebugInfo(`Error: ${error.message || error}`);
      }
    };

    testFetch();
  }, [dispatch]);

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
      <h3 className="font-bold text-yellow-800">Debug Info:</h3>
      <pre className="text-sm mt-2 text-yellow-700">
        {JSON.stringify({
          debugInfo,
          files: fileState.files,
          filesType: typeof fileState.files,
          filesIsArray: Array.isArray(fileState.files),
          loading: fileState.loading,
          error: fileState.error
        }, null, 2)}
      </pre>
    </div>
  );
};

export default FileDebugger;
