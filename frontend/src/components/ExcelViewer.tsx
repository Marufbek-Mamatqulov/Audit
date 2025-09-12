import React, { useState, useEffect, useRef, useCallback } from 'react';
import { read, utils, writeFile, WorkBook } from 'xlsx';
import { 
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  MinusIcon,
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  PaintBrushIcon,
  TableCellsIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

interface ExcelViewerProps {
  fileUrl: string;
  fileName: string;
  canEdit: boolean;
  onSave?: (data: any) => void;
  onBack: () => void;
}

interface CellData {
  value: any;
  formula?: string;
  type?: 'number' | 'string' | 'boolean' | 'date' | 'formula';
  style?: {
    backgroundColor?: string;
    color?: string;
    fontWeight?: string | number;
    fontSize?: string | number;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    border?: string;
    borderTop?: string;
    borderRight?: string;
    borderBottom?: string;
    borderLeft?: string;
    fontFamily?: string;
    textDecoration?: string;
    fontStyle?: string;
    padding?: string;
    margin?: string;
    wordWrap?: boolean;
    overflow?: string;
    whiteSpace?: string;
  };
  merge?: {
    rowspan?: number;
    colspan?: number;
    isMerged?: boolean;
    isStart?: boolean;
  };
  comment?: string;
  hyperlink?: string;
}

interface SheetData {
  [cellAddress: string]: CellData;
}

interface ColumnWidths {
  [colIndex: number]: number;
}

interface RowHeights {
  [rowIndex: number]: number;
}

interface FrozenPanes {
  row: number;
  col: number;
}

const ExcelViewer: React.FC<ExcelViewerProps> = ({ 
  fileUrl, 
  fileName, 
  canEdit, 
  onSave, 
  onBack 
}) => {
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);
  const [currentSheet, setCurrentSheet] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheetData, setSheetData] = useState<SheetData>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string[]>([]);
  const [formulaInput, setFormulaInput] = useState<string>('');
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showGridlines, setShowGridlines] = useState(true);
  const [showFormulas, setShowFormulas] = useState(false);
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({});
  const [rowHeights, setRowHeights] = useState<RowHeights>({});
  const [frozenPanes, setFrozenPanes] = useState<FrozenPanes>({ row: 0, col: 0 });
  const [isResizing, setIsResizing] = useState<{type: 'column' | 'row', index: number} | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, show: boolean}>({x: 0, y: 0, show: false});
  const [clipboard, setClipboard] = useState<{data: any[], range: string[]} | null>(null);
  
  // Formatting states
  const [currentFont, setCurrentFont] = useState('Calibri');
  const [currentFontSize, setCurrentFontSize] = useState(11);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [currentTextColor, setCurrentTextColor] = useState('#000000');
  const [currentBgColor, setCurrentBgColor] = useState('#ffffff');
  const [currentAlign, setCurrentAlign] = useState<'left' | 'center' | 'right'>('left');
  const [currentVerticalAlign, setCurrentVerticalAlign] = useState<'top' | 'middle' | 'bottom'>('middle');
  
  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const headerRowRef = useRef<HTMLDivElement>(null);
  const headerColRef = useRef<HTMLDivElement>(null);

  // Real Excel data with complex formatting, formulas, and merged cells
  const loadExcelLikeData = () => {
    const excelData: SheetData = {
      // Title section (merged cells)
      'C1': { 
        value: 'Ўзбекистон Республикаси Вазирлар Маҳкамасининг 2023 йил 5 сентябрдаги "Рақамли технологиялар соҳасида мутахассислар тайёрлашнинг янги тизимини жорий этиш ҳамда унинг сохасини билим ва кўникмаларини янада ривожлантириш чора-тадбирлари тўғрисида" 451-сон қарори (ИМК-41-05.09.2023 й.)', 
        style: { 
          fontWeight: 'bold',
          fontSize: '11px',
          fontFamily: 'Calibri',
          textAlign: 'left',
          backgroundColor: '#FFFFFF',
          padding: '4px',
          wordWrap: true
        },
        merge: { colspan: 10, rowspan: 1, isMerged: true, isStart: true }
      },
      
      // Main table headers with colors exactly like in Excel
      'A1': { 
        value: 'Рақамли талимини ривожлантириш марказида йиллик ривожлантириш марказида', 
        style: { 
          fontWeight: 'bold',
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'left',
          padding: '2px 4px',
          wordWrap: true
        } 
      },
      
      'B1': { 
        value: 'Т.р.', 
        style: { 
          fontWeight: 'bold',
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'C1+': { 
        value: 'Харажатлар модаcди', 
        style: { 
          fontWeight: 'bold',
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      // Sub-headers with background colors
      'D2': { 
        value: 'Харажат тури', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px'
        } 
      },
      
      'E2': { 
        value: 'Сметада статўя рақами', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px'
        } 
      },
      
      'F2': { 
        value: 'Бандга', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px'
        } 
      },
      
      'G2': { 
        value: 'Ажратилган', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px'
        } 
      },
      
      // Monthly headers with green background
      'H2': { 
        value: 'апрель', 
        style: { 
          backgroundColor: '#D5E8D4',
          border: '1px solid #82B366',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px',
          fontWeight: 'bold'
        } 
      },
      
      'I2': { 
        value: 'касса', 
        style: { 
          backgroundColor: '#D5E8D4',
          border: '1px solid #82B366',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px'
        } 
      },
      
      'J2': { 
        value: 'х/ҳисоб', 
        style: { 
          backgroundColor: '#D5E8D4',
          border: '1px solid #82B366',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px'
        } 
      },
      
      'K2': { 
        value: 'май', 
        style: { 
          backgroundColor: '#D5E8D4',
          border: '1px solid #82B366',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px',
          fontWeight: 'bold'
        } 
      },
      
      'L2': { 
        value: 'касса', 
        style: { 
          backgroundColor: '#D5E8D4',
          border: '1px solid #82B366',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px'
        } 
      },
      
      'M2': { 
        value: 'х/ҳисоб', 
        style: { 
          backgroundColor: '#D5E8D4',
          border: '1px solid #82B366',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px'
        } 
      },
      
      'N2': { 
        value: 'июнь', 
        style: { 
          backgroundColor: '#D5E8D4',
          border: '1px solid #82B366',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px',
          fontWeight: 'bold'
        } 
      },
      
      'O2': { 
        value: 'касса', 
        style: { 
          backgroundColor: '#D5E8D4',
          border: '1px solid #82B366',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px'
        } 
      },
      
      'P2': { 
        value: 'х/ҳисоб', 
        style: { 
          backgroundColor: '#D5E8D4',
          border: '1px solid #82B366',
          fontSize: '9px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px'
        } 
      },
      
      // Data rows with exact Excel styling
      'A5': { 
        value: 'Рақамли талимини ривожлантириш марказида йиллик', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'left',
          padding: '2px 4px'
        } 
      },
      
      'B5': { 
        value: '1', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'C5': { 
        value: 'Заработная плата', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'left',
          padding: '2px 4px'
        } 
      },
      
      'D5': { 
        value: '10', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'E5': { 
        value: '000', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'F5': { 
        value: '2,045,747.40', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px'
        } 
      },
      
      'G5': { 
        value: '(5,612,038.20)', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px',
          color: '#FF0000'  // Red color for negative numbers
        } 
      },
      
      'H5': { 
        value: '-', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'I5': { 
        value: '2,147,303.00', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px'
        } 
      },
      
      'J5': { 
        value: '(7,759,341.20)', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px',
          color: '#FF0000'  // Red color for negative numbers
        } 
      },
      
      'K5': { 
        value: '-', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'L5': { 
        value: '(7,759,341.20)', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px',
          color: '#FF0000'  // Red color for negative numbers
        } 
      },
      
      // More data rows with formulas
      'A6': { 
        value: 'Рақамли талимини ривожлантириш марказида йиллик', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'left',
          padding: '2px 4px'
        } 
      },
      
      'B6': { 
        value: '2', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'C6': { 
        value: 'Заработная плата в денежной форме', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'left',
          padding: '2px 4px'
        } 
      },
      
      'D6': { 
        value: '41', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'E6': { 
        value: '11', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'F6': { 
        value: '000', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'G6': { 
        value: '2,045,747.40', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px'
        } 
      },
      
      'H6': { 
        value: '(5,612,038.20)', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px',
          color: '#FF0000'
        } 
      },
      
      'I6': { 
        value: '-', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      // More data with formulas and better colors
      'G7': { 
        value: '=SUM(H7:P7)', 
        formula: 'SUM(H7:P7)',
        type: 'formula',
        style: { 
          backgroundColor: '#FFF2CC',
          border: '1px solid #D6B656',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px',
          fontWeight: 'bold'
        } 
      },

      'H7': { 
        value: '500000', 
        style: { 
          backgroundColor: '#E2EFDA',
          border: '1px solid #70AD47',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px'
        } 
      },

      'I7': { 
        value: '=H7*0.12', 
        formula: 'H7*0.12',
        type: 'formula',
        style: { 
          backgroundColor: '#DEEAF6',
          border: '1px solid #5B9BD5',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px'
        } 
      },

      'J7': { 
        value: '300000', 
        style: { 
          backgroundColor: '#E2EFDA',
          border: '1px solid #70AD47',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px'
        } 
      },

      'K7': { 
        value: '=J7*1.15', 
        formula: 'J7*1.15',
        type: 'formula',
        style: { 
          backgroundColor: '#FCE4D6',
          border: '1px solid #C65911',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px'
        } 
      },

      'J6': { 
        value: '2,147,303.00', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px'
        } 
      },
      
      'K6': { 
        value: '(7,759,341.20)', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px',
          color: '#FF0000'
        } 
      },
      
      'L6': { 
        value: '-', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'M6': { 
        value: '(7,759,341.20)', 
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px',
          color: '#FF0000'
        } 
      },
      
      // Blue background row
      'A7': { 
        value: 'Рақамли талимини ривожлантириш марказида йиллик', 
        style: { 
          backgroundColor: '#DEEAF6',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'left',
          padding: '2px 4px'
        } 
      },
      
      'B7': { 
        value: '3', 
        style: { 
          backgroundColor: '#DEEAF6',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'C7': { 
        value: 'Основная заработная плата', 
        style: { 
          backgroundColor: '#DEEAF6',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'left',
          padding: '2px 4px'
        } 
      },
      
      'D7': { 
        value: '41', 
        style: { 
          backgroundColor: '#DEEAF6',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'E7': { 
        value: '11', 
        style: { 
          backgroundColor: '#DEEAF6',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'F7': { 
        value: '100', 
        style: { 
          backgroundColor: '#DEEAF6',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'center',
          padding: '2px 4px'
        } 
      },
      
      'G8': { 
        value: '2,045,747.40', 
        style: { 
          backgroundColor: '#DEEAF6',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px'
        } 
      },
      
      'H8': { 
        value: '(5,612,038.20)', 
        style: { 
          backgroundColor: '#DEEAF6',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px',
          color: '#FF0000'
        } 
      },
      
      // Sample formulas
      'G10': { 
        value: '=SUM(G5:G9)', 
        formula: '=SUM(G5:G9)',
        type: 'formula',
        style: { 
          backgroundColor: '#FFFFFF',
          border: '1px solid #000000',
          fontSize: '10px',
          fontFamily: 'Calibri',
          textAlign: 'right',
          padding: '2px 4px',
          fontWeight: 'bold'
        } 
      },
    };
    
    setSheetData(excelData);
    setCurrentSheet('Смета 2025 йил (Учет) 04.06.2025');
    
    // Set frozen panes like in real Excel
    setFrozenPanes({ row: 4, col: 2 });
    
    // Set column widths to match Excel
    setColumnWidths({
      0: 200,  // Column A - wider for descriptions
      1: 40,   // Column B - narrow for numbers
      2: 150,  // Column C - medium for descriptions
      3: 40,   // Column D
      4: 40,   // Column E
      5: 40,   // Column F
      6: 90,   // Column G - for amounts
      7: 90,   // Column H
      8: 50,   // Column I
      9: 90,   // Column J
      10: 90,  // Column K
      11: 50,  // Column L
      12: 90,  // Column M
      13: 50,  // Column N
      14: 90,  // Column O
      15: 90,  // Column P
    });
    
    // Set row heights
    setRowHeights({
      0: 60,  // Title row - taller
      1: 25,  // Header row
      2: 25,  // Sub-header row
      3: 25,  // Data rows
      4: 25,
      5: 25,
      6: 25,
      7: 25,
    });
    
    const demoWorkbook: WorkBook = {
      SheetNames: ['Смета 2025 йил (Учет) 04.06.2025', 'Жорий харажатлар', 'Капитал харажатлар', 'Жами'],
      Sheets: {
        'Смета 2025 йил (Учет) 04.06.2025': {},
        'Жорий харажатлар': {},
        'Капитал харажатлар': {},
        'Жами': {}
      }
    };
    setWorkbook(demoWorkbook);
    setSheetNames(demoWorkbook.SheetNames);
    setCurrentSheet(demoWorkbook.SheetNames[0]);
  };

  const maxRow = 100;
  const maxCol = 50;

  // Ustun nomini olish (A, B, C, ... AA, AB, ...)
  const getColumnName = (colIndex: number): string => {
    let result = '';
    let temp = colIndex;
    
    while (temp >= 0) {
      result = String.fromCharCode(65 + (temp % 26)) + result;
      temp = Math.floor(temp / 26) - 1;
    }
    
    return result;
  };

  // Event handlers
  const handleCellClick = (cellAddress: string) => {
    setSelectedCell(cellAddress);
    const cellData = sheetData[cellAddress];
    setFormulaInput(cellData?.formula || cellData?.value?.toString() || '');
    setContextMenu({ x: 0, y: 0, show: false });
    setEditingCell(null); // Stop editing when clicking another cell
    
    // Update formatting toolbar states
    if (cellData?.style) {
      setIsBold(cellData.style.fontWeight === 'bold');
      setIsItalic(cellData.style.fontStyle === 'italic');
      setIsUnderline(cellData.style.textDecoration?.includes('underline') || false);
      setCurrentTextColor(cellData.style.color || '#000000');
      setCurrentBgColor(cellData.style.backgroundColor || '#ffffff');
      setCurrentAlign(cellData.style.textAlign as any || 'left');
      setCurrentFont(cellData.style.fontFamily || 'Calibri');
      setCurrentFontSize(parseInt(cellData.style.fontSize as string) || 11);
    }
  };

  const handleCellDoubleClick = (cellAddress: string) => {
    if (canEdit) {
      setEditingCell(cellAddress);
      const cellData = sheetData[cellAddress];
      setFormulaInput(cellData?.formula || cellData?.value?.toString() || '');
    }
  };

  const handleCellEdit = (cellAddress: string, value: string) => {
    setSheetData(prev => ({
      ...prev,
      [cellAddress]: {
        ...prev[cellAddress],
        value: value,
        formula: value.startsWith('=') ? value : undefined,
        type: value.startsWith('=') ? 'formula' : 'string'
      }
    }));
  };

  const applyFormatting = (format: string, value?: any) => {
    if (!selectedCell) return;
    
    setSheetData(prev => ({
      ...prev,
      [selectedCell]: {
        ...prev[selectedCell],
        style: {
          ...prev[selectedCell]?.style,
          [format]: value
        }
      }
    }));
  };

  const handleBold = () => {
    const newBold = !isBold;
    setIsBold(newBold);
    applyFormatting('fontWeight', newBold ? 'bold' : 'normal');
  };

  const handleItalic = () => {
    const newItalic = !isItalic;
    setIsItalic(newItalic);
    applyFormatting('fontStyle', newItalic ? 'italic' : 'normal');
  };

  const handleUnderline = () => {
    const newUnderline = !isUnderline;
    setIsUnderline(newUnderline);
    applyFormatting('textDecoration', newUnderline ? 'underline' : 'none');
  };

  const handleTextColor = (color: string) => {
    setCurrentTextColor(color);
    applyFormatting('color', color);
  };

  const handleBgColor = (color: string) => {
    setCurrentBgColor(color);
    applyFormatting('backgroundColor', color);
  };

  const handleAlign = (align: 'left' | 'center' | 'right') => {
    setCurrentAlign(align);
    applyFormatting('textAlign', align);
  };

  const handleFontChange = (font: string) => {
    setCurrentFont(font);
    applyFormatting('fontFamily', font);
  };

  const handleFontSizeChange = (size: number) => {
    setCurrentFontSize(size);
    applyFormatting('fontSize', `${size}px`);
  };

  const handleCopy = () => {
    if (selectedCell) {
      const cellData = sheetData[selectedCell];
      setClipboard({
        data: [cellData],
        range: [selectedCell]
      });
    }
  };

  const handlePaste = () => {
    if (!clipboard || !selectedCell) return;
    
    const [data] = clipboard.data;
    if (data) {
      setSheetData(prev => ({
        ...prev,
        [selectedCell]: {
          ...data,
          value: data.value,
          formula: data.formula,
          style: { ...data.style }
        }
      }));
    }
  };

  const handleExport = () => {
    if (!workbook) return;
    writeFile(workbook, `${fileName}_edited.xlsx`);
  };

  const handleColumnResize = (colIndex: number, newWidth: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [colIndex]: Math.max(50, newWidth)
    }));
  };

  const handleRowResize = (rowIndex: number, newHeight: number) => {
    setRowHeights(prev => ({
      ...prev,
      [rowIndex]: Math.max(20, newHeight)
    }));
  };

  // Scroll handler for frozen panes
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (headerRowRef.current) {
      headerRowRef.current.scrollLeft = target.scrollLeft;
    }
    if (headerColRef.current) {
      headerColRef.current.scrollTop = target.scrollTop;
    }
  }, []);

  // File loading
  useEffect(() => {
    if (fileUrl && fileUrl !== 'demo') {
      const loadFile = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await fetch(fileUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const wb = read(arrayBuffer, { 
            type: 'array',
            cellStyles: true,
            cellFormula: true,
            cellHTML: false
          });
          
          setWorkbook(wb);
          const firstSheet = wb.SheetNames[0];
          setCurrentSheet(firstSheet);
          
          const worksheet = wb.Sheets[firstSheet];
          const processedData: SheetData = {};
          const range = utils.decode_range(worksheet['!ref'] || 'A1:A1');
          
          for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
              const cellAddress = utils.encode_cell({ r, c });
              const cell = worksheet[cellAddress];
              
              if (cell) {
                processedData[cellAddress] = {
                  value: cell.v,
                  formula: cell.f,
                  type: cell.t as any,
                  style: {
                    backgroundColor: cell.s?.fill?.fgColor?.rgb ? `#${cell.s.fill.fgColor.rgb}` : '#FFFFFF',
                    color: cell.s?.font?.color?.rgb ? `#${cell.s.font.color.rgb}` : '#000000',
                    fontWeight: cell.s?.font?.bold ? 'bold' : 'normal',
                    fontSize: cell.s?.font?.sz ? `${cell.s.font.sz}px` : '11px',
                    fontFamily: cell.s?.font?.name || 'Calibri',
                    textAlign: cell.s?.alignment?.horizontal || 'left',
                    verticalAlign: cell.s?.alignment?.vertical || 'middle',
                    border: cell.s?.border ? '1px solid #000000' : '1px solid #C5C5C5'
                  }
                };
              }
            }
          }
          
          setSheetData(processedData);
          setLoading(false);
        } catch (error) {
          console.error('Fayl yuklashda xatolik:', error);
          setError('Fayl yuklanmadi. Iltimos, qaytadan urinib ko\'ring.');
          setLoading(false);
        }
      };

      loadFile();
    } else {
      loadExcelLikeData();
      setLoading(false);
    }
  }, [fileUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Yuklanmoqda...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Orqaga
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col" style={{ fontFamily: 'Calibri, sans-serif' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Orqaga
            </button>
            <h2 className="text-xl font-semibold text-gray-800">{fileName}</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
              Yuklab olish
            </button>
            
            {canEdit && onSave && (
              <button
                onClick={() => onSave(workbook)}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Saqlash
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MS Excel Style Ribbon/Toolbar */}
      {canEdit && (
        <div className="bg-white border-b border-gray-200 px-4 py-2" style={{ backgroundColor: '#F8F9FA' }}>
          <div className="flex items-center space-x-6 text-sm">
            {/* File Operations */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="px-2 py-1 border rounded hover:bg-gray-50"
                title="Nusxalash (Ctrl+C)"
              >
                📋
              </button>
              <button
                onClick={handlePaste}
                className="px-2 py-1 border rounded hover:bg-gray-50"
                title="Joylashtirish (Ctrl+V)"
              >
                📄
              </button>
            </div>

            <div className="border-l h-6 mx-2"></div>

            {/* Font */}
            <div className="flex items-center space-x-2">
              <select
                value={currentFont}
                onChange={(e) => handleFontChange(e.target.value)}
                className="px-2 py-1 border rounded text-xs"
                style={{ fontFamily: 'Calibri' }}
              >
                <option value="Calibri">Calibri</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
              </select>
              
              <select
                value={currentFontSize}
                onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                className="px-2 py-1 border rounded text-xs w-16"
              >
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
                <option value="14">14</option>
                <option value="16">16</option>
                <option value="18">18</option>
                <option value="20">20</option>
                <option value="24">24</option>
              </select>
            </div>

            <div className="border-l h-6 mx-2"></div>

            {/* Font Style */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleBold}
                className={`px-2 py-1 border rounded hover:bg-gray-50 ${isBold ? 'bg-blue-100 border-blue-300' : ''}`}
                title="Qalin (Ctrl+B)"
              >
                <BoldIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleItalic}
                className={`px-2 py-1 border rounded hover:bg-gray-50 ${isItalic ? 'bg-blue-100 border-blue-300' : ''}`}
                title="Qiya (Ctrl+I)"
              >
                <ItalicIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleUnderline}
                className={`px-2 py-1 border rounded hover:bg-gray-50 ${isUnderline ? 'bg-blue-100 border-blue-300' : ''}`}
                title="Chiziq (Ctrl+U)"
              >
                <UnderlineIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="border-l h-6 mx-2"></div>

            {/* Colors */}
            <div className="flex items-center space-x-2">
              <div className="flex flex-col items-center">
                <span className="text-xs mb-1">A</span>
                <input
                  type="color"
                  value={currentTextColor}
                  onChange={(e) => handleTextColor(e.target.value)}
                  className="w-6 h-4 border rounded cursor-pointer"
                  title="Matn rangi"
                />
              </div>
              <div className="flex flex-col items-center">
                <PaintBrushIcon className="w-3 h-3 mb-1" />
                <input
                  type="color"
                  value={currentBgColor}
                  onChange={(e) => handleBgColor(e.target.value)}
                  className="w-6 h-4 border rounded cursor-pointer"
                  title="Fon rangi"
                />
              </div>
            </div>

            <div className="border-l h-6 mx-2"></div>

            {/* Alignment */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleAlign('left')}
                className={`px-2 py-1 border rounded hover:bg-gray-50 ${currentAlign === 'left' ? 'bg-blue-100 border-blue-300' : ''}`}
                title="Chapga"
              >
                ⬅
              </button>
              <button
                onClick={() => handleAlign('center')}
                className={`px-2 py-1 border rounded hover:bg-gray-50 ${currentAlign === 'center' ? 'bg-blue-100 border-blue-300' : ''}`}
                title="Markazga"
              >
                ↔
              </button>
              <button
                onClick={() => handleAlign('right')}
                className={`px-2 py-1 border rounded hover:bg-gray-50 ${currentAlign === 'right' ? 'bg-blue-100 border-blue-300' : ''}`}
                title="O'ngga"
              >
                ➡
              </button>
            </div>

            <div className="border-l h-6 mx-2"></div>

            {/* Zoom */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoom(prev => Math.max(25, prev - 25))}
                className="px-2 py-1 border rounded hover:bg-gray-50"
                title="Kichraytirish"
              >
                <MinusIcon className="w-4 h-4" />
              </button>
              <span className="text-xs min-w-12 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(prev => Math.min(400, prev + 25))}
                className="px-2 py-1 border rounded hover:bg-gray-50"
                title="Kattalshtirish"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="border-l h-6 mx-2"></div>

            {/* View Options */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={showGridlines}
                  onChange={(e) => setShowGridlines(e.target.checked)}
                  className="mr-1"
                />
                Gridlar
              </label>
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={showFormulas}
                  onChange={(e) => setShowFormulas(e.target.checked)}
                  className="mr-1"
                />
                Formulalar
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Formula Bar - Like Excel */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center space-x-2" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="flex items-center space-x-2 text-sm">
          <span className="font-medium min-w-16">{selectedCell || 'A1'}</span>
          <span>fx</span>
          <input
            type="text"
            value={formulaInput}
            onChange={(e) => setFormulaInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && selectedCell) {
                handleCellEdit(selectedCell, formulaInput);
                setSelectedCell(null);
              }
              if (e.key === 'Escape') {
                setSelectedCell(null);
              }
            }}
            className="flex-1 px-2 py-1 border rounded text-sm"
            placeholder="Formula yoki qiymat kiriting..."
            style={{ fontFamily: 'Calibri' }}
          />
        </div>
      </div>

      {/* Excel Spreadsheet with Frozen Panes */}
      <div className="flex-1 bg-white relative overflow-hidden">
        {/* Top-left corner */}
        <div 
          className="absolute top-0 left-0 z-30 bg-gray-100 border-r border-b border-gray-300 flex items-center justify-center"
          style={{ width: 50, height: 25 }}
        >
        </div>

        {/* Frozen Column Headers */}
        <div 
          ref={headerRowRef}
          className="absolute top-0 left-0 right-0 z-20 bg-gray-100 border-b border-gray-300 overflow-hidden"
          style={{ height: 25, marginLeft: 50 }}
        >
          <div className="flex">
            {Array.from({ length: maxCol }, (_, colIndex) => (
              <div
                key={colIndex}
                className="h-6 bg-gray-100 border-r border-gray-300 flex items-center justify-center text-xs font-medium text-gray-700 relative flex-shrink-0"
                style={{ 
                  width: columnWidths[colIndex] || 80,
                  fontSize: '10px',
                  fontFamily: 'Calibri, sans-serif',
                  backgroundColor: colIndex < frozenPanes.col ? '#E8F4FD' : '#F0F0F0'
                }}
              >
                {getColumnName(colIndex)}
                
                {/* Column resize handle */}
                <div
                  className="absolute right-0 top-0 w-1 h-full bg-transparent hover:bg-blue-500 cursor-col-resize"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing({type: 'column', index: colIndex});
                    
                    const startX = e.clientX;
                    const startWidth = columnWidths[colIndex] || 80;
                    
                    const handleMouseMove = (moveE: MouseEvent) => {
                      const newWidth = startWidth + (moveE.clientX - startX);
                      handleColumnResize(colIndex, newWidth);
                    };
                    
                    const handleMouseUp = () => {
                      setIsResizing(null);
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Frozen Row Headers */}
        <div 
          ref={headerColRef}
          className="absolute top-0 left-0 bottom-0 z-20 bg-gray-100 border-r border-gray-300 overflow-hidden"
          style={{ width: 50, marginTop: 25 }}
        >
          <div className="flex flex-col">
            {Array.from({ length: maxRow }, (_, rowIndex) => (
              <div
                key={rowIndex}
                className="w-12 text-xs font-medium text-gray-700 text-center relative flex items-center justify-center flex-shrink-0"
                style={{ 
                  height: rowHeights[rowIndex] || 22,
                  backgroundColor: rowIndex < frozenPanes.row ? '#E8F4FD' : '#F0F0F0',
                  border: '1px solid #C5C5C5',
                  fontSize: '10px',
                  fontFamily: 'Calibri, sans-serif'
                }}
              >
                {rowIndex + 1}
                
                {/* Row resize handle */}
                <div
                  className="absolute bottom-0 left-0 w-full h-1 bg-transparent hover:bg-blue-500 cursor-row-resize"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsResizing({type: 'row', index: rowIndex});
                    
                    const startY = e.clientY;
                    const startHeight = rowHeights[rowIndex] || 22;
                    
                    const handleMouseMove = (moveE: MouseEvent) => {
                      const newHeight = startHeight + (moveE.clientY - startY);
                      handleRowResize(rowIndex, newHeight);
                    };
                    
                    const handleMouseUp = () => {
                      setIsResizing(null);
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          className="overflow-auto"
          style={{ 
            marginTop: 25,
            marginLeft: 50,
            height: 'calc(100vh - 250px)',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left'
          }}
          onScroll={handleScroll}
        >
          <table 
            ref={tableRef}
            className="border-collapse"
            style={{ 
              fontSize: '11px',
              fontFamily: 'Calibri, sans-serif',
              backgroundColor: '#FFFFFF',
              borderSpacing: 0
            }}
          >
            <tbody>
              {Array.from({ length: maxRow }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: maxCol }, (_, colIndex) => {
                    const cellAddress = utils.encode_cell({ r: rowIndex, c: colIndex });
                    const cellData = sheetData[cellAddress];
                    const isSelected = selectedCell === cellAddress;
                    const displayValue = showFormulas && cellData?.formula ? cellData.formula : cellData?.value;
                    
                    // Check for merged cells
                    if (cellData?.merge?.isMerged && !cellData.merge.isStart) {
                      return null; // Don't render merged cells that aren't the start
                    }
                    
                    return (
                      <td
                        key={cellAddress}
                        className={`cursor-cell relative ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-blue-50'}`}
                        style={{
                          width: columnWidths[colIndex] || 80,
                          height: rowHeights[rowIndex] || 22,
                          minWidth: columnWidths[colIndex] || 80,
                          minHeight: rowHeights[rowIndex] || 22,
                          backgroundColor: isSelected ? '#CCE7FF' : cellData?.style?.backgroundColor || '#FFFFFF',
                          color: cellData?.style?.color || '#000000',
                          fontWeight: cellData?.style?.fontWeight || 'normal',
                          fontSize: cellData?.style?.fontSize || '11px',
                          textAlign: cellData?.style?.textAlign || 'left',
                          verticalAlign: cellData?.style?.verticalAlign || 'middle',
                          fontFamily: cellData?.style?.fontFamily || 'Calibri',
                          fontStyle: cellData?.style?.fontStyle || 'normal',
                          textDecoration: cellData?.style?.textDecoration || 'none',
                          border: showGridlines ? (cellData?.style?.border || '1px solid #D0D7DE') : 'none',
                          borderTop: cellData?.style?.borderTop,
                          borderRight: cellData?.style?.borderRight,
                          borderBottom: cellData?.style?.borderBottom,
                          borderLeft: cellData?.style?.borderLeft,
                          padding: cellData?.style?.padding || '2px 4px',
                          overflow: 'hidden',
                          whiteSpace: cellData?.style?.whiteSpace || 'nowrap',
                          textOverflow: 'ellipsis',
                          boxSizing: 'border-box'
                        }}
                        colSpan={cellData?.merge?.colspan || 1}
                        rowSpan={cellData?.merge?.rowspan || 1}
                        onClick={() => handleCellClick(cellAddress)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            show: true
                          });
                          handleCellClick(cellAddress);
                        }}
                        onDoubleClick={() => handleCellDoubleClick(cellAddress)}
                        title={cellData?.comment || cellData?.formula || ''}
                      >
                        {canEdit && editingCell === cellAddress ? (
                          <input
                            type="text"
                            value={formulaInput}
                            onChange={(e) => setFormulaInput(e.target.value)}
                            onBlur={() => {
                              handleCellEdit(cellAddress, formulaInput);
                              setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellEdit(cellAddress, formulaInput);
                                setEditingCell(null);
                              }
                              if (e.key === 'Escape') {
                                setEditingCell(null);
                              }
                              if (e.key === 'Tab') {
                                e.preventDefault();
                                handleCellEdit(cellAddress, formulaInput);
                                const nextCol = colIndex + 1 < maxCol ? colIndex + 1 : 0;
                                const nextRow = nextCol === 0 ? rowIndex + 1 : rowIndex;
                                if (nextRow < maxRow) {
                                  const nextAddress = utils.encode_cell({ r: nextRow, c: nextCol });
                                  setEditingCell(nextAddress);
                                  setSelectedCell(nextAddress);
                                  setFormulaInput(sheetData[nextAddress]?.formula || sheetData[nextAddress]?.value?.toString() || '');
                                }
                              }
                            }}
                            className="w-full h-full border-none outline-none bg-transparent"
                            style={{
                              fontFamily: cellData?.style?.fontFamily || 'Calibri',
                              fontSize: cellData?.style?.fontSize || '11px',
                              fontWeight: cellData?.style?.fontWeight || 'normal',
                              color: cellData?.style?.color || '#000000'
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="w-full h-full flex items-center" style={{ minHeight: '18px' }}>
                            {displayValue || ''}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-white border border-gray-200 shadow-lg rounded z-50 py-1 min-w-32"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={() => setContextMenu({x: 0, y: 0, show: false})}
        >
          <button
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => {
              handleCopy();
              setContextMenu({x: 0, y: 0, show: false});
            }}
          >
            📋 Nusxalash
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => {
              handlePaste();
              setContextMenu({x: 0, y: 0, show: false});
            }}
          >
            📄 Joylashtirish
          </button>
          <hr className="my-1" />
          <button
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => {
              if (selectedCell) {
                applyFormatting('backgroundColor', '#FFFF99');
              }
              setContextMenu({x: 0, y: 0, show: false});
            }}
          >
            🎨 Belgilash
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => {
              if (selectedCell) {
                setFrozenPanes({ 
                  row: utils.decode_cell(selectedCell).r, 
                  col: utils.decode_cell(selectedCell).c 
                });
              }
              setContextMenu({x: 0, y: 0, show: false});
            }}
          >
            ❄️ Qotirish
          </button>
        </div>
      )}

      {/* Sheet Tabs */}
      <div className="bg-white border-t border-gray-200 px-2 py-1">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            {/* Sheet Navigation Buttons */}
            <div className="flex items-center space-x-1 mr-4">
              <button className="p-1 hover:bg-gray-100 rounded">
                <span className="text-xs">⏮</span>
              </button>
              <button className="p-1 hover:bg-gray-100 rounded">
                <span className="text-xs">◀</span>
              </button>
              <button className="p-1 hover:bg-gray-100 rounded">
                <span className="text-xs">▶</span>
              </button>
              <button className="p-1 hover:bg-gray-100 rounded">
                <span className="text-xs">⏭</span>
              </button>
            </div>
            
            {/* Sheet Tabs */}
            <div className="flex items-center space-x-1">
              {sheetNames.map((sheetName, index) => (
                <div
                  key={sheetName}
                  className={`px-3 py-1 border-t border-l border-r cursor-pointer text-xs select-none ${
                    currentSheet === sheetName
                      ? 'bg-white border-b-white border-gray-300 text-black font-medium'
                      : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{
                    borderTopLeftRadius: '4px',
                    borderTopRightRadius: '4px',
                    borderBottom: currentSheet === sheetName ? '2px solid white' : '1px solid #d1d5db',
                    marginBottom: currentSheet === sheetName ? '-1px' : '0'
                  }}
                  onClick={() => setCurrentSheet(sheetName)}
                >
                  {sheetName}
                </div>
              ))}
              <button 
                className="ml-2 p-1 hover:bg-gray-100 rounded text-gray-500"
                title="Yangi sheet qo'shish"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            
            {/* Cell Info */}
            {selectedCell && (
              <div className="ml-6 text-xs text-gray-600">
                <span>Katakcha: <strong>{selectedCell}</strong></span>
                {sheetData[selectedCell]?.formula && (
                  <span className="ml-2 text-blue-600">
                    Formula: = {sheetData[selectedCell]?.formula}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Zoom: {zoom}%</span>
            <span>Sahifa: 1 / 1</span>
            <div className="w-2 h-4 bg-gray-300 cursor-ew-resize"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelViewer;

// Module export to fix TypeScript isolated modules
export type { ExcelViewerProps, CellData, SheetData };
