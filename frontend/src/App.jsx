
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, Download, Mail, Diamond, Menu, X, Sun, Moon } from 'lucide-react';
import * as XLSX from 'xlsx';
import logo from './logo.gif';

const App = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const inventoryRef = useRef(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [diamonds, setDiamonds] = useState([]);
    const [filters, setFilters] = useState({
        shapes: [],
        colors: [],
        clarities: [],
        labs: [],
        fluorescence: [],
        locations: [],
        certificates: []
    });
    const [selectedFilters, setSelectedFilters] = useState(() => {
        const params = Object.fromEntries(searchParams.entries());
        return {
            shape: params.shape ? params.shape.split(',') : [],
            colorFrom: params.colorFrom || '',
            colorTo: params.colorTo || '',
            clarityFrom: params.clarityFrom || '',
            clarityTo: params.clarityTo || '',
            minWeight: params.minWeight || '',
            maxWeight: params.maxWeight || '',
            stockNumber: params.stockNumber || '',
            minLength: params.minLength || '',
            maxLength: params.maxLength || '',
            minWidth: params.minWidth || '',
            maxWidth: params.maxWidth || '',
            fluorescence: params.fluorescence || '',
            pairSingle: params.pairSingle || '',
            location: params.location || '',
            certificate: params.certificate || ''
        };
    });
    const [selectedRows, setSelectedRows] = useState([]);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        fetchFilters();
        fetchDiamonds();
    }, []);

    const fetchFilters = async () => {
        try {
            const res = await axios.get('/api/filters');
            setFilters(res.data);
        } catch (err) {
            console.error('Error fetching filters:', err);
        }
    };

    const fetchDiamonds = async (actualFilters = selectedFilters) => {
        try {
            // Update URL search parameters only when performing a search
            const cleanParams = {};
            Object.entries(actualFilters).forEach(([key, val]) => {
                if (val && (Array.isArray(val) ? val.length > 0 : true)) {
                    cleanParams[key] = Array.isArray(val) ? val.join(',') : val;
                }
            });
            setSearchParams(cleanParams, { replace: true });

            const res = await axios.get('/api/diamonds', { params: actualFilters });
            setDiamonds(res.data);

            // Handle scroll restoration on initial load
            if (isInitialLoad) {
                const savedScroll = sessionStorage.getItem('inventoryScroll');
                if (savedScroll) {
                    // Use a small delay to ensure the table has rendered
                    setTimeout(() => {
                        if (inventoryRef.current) {
                            inventoryRef.current.scrollTop = parseInt(savedScroll);
                        }
                    }, 100);
                }
                setIsInitialLoad(false);
            }
        } catch (err) {
            console.error('Error fetching diamonds:', err);
        }
    };

    const handleScroll = (e) => {
        sessionStorage.setItem('inventoryScroll', e.target.scrollTop);
    };

    const handleSingleFilterChange = (field, value) => {
        setSelectedFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleExport = () => {
        // Export selected rows if any are checked, otherwise export all current results
        const toExport = selectedRows.length > 0
            ? diamonds.filter(d => selectedRows.includes(d.id))
            : diamonds;

        if (toExport.length === 0) {
            alert('No diamonds to export. Please run a search first.');
            return;
        }

        const rows = toExport.map(d => ({
            'Stock #': d.stock_id,
            'Shape': d.shape,
            'Qty': d.qty,
            'Pairing': d.is_matched_pair,
            'Weight': d.weight,
            'Color': d.color,
            'Clarity': d.clarity,
            'Fluorescence': d.fluorescence || '-',
            'Lab': d.lab || '-',
            'Certificate No.': d.certificate,
            'List p/c': d.list_price ? parseFloat(d.list_price) : '',
            'Total price': d.total_price ? parseFloat(d.total_price) : '',
            'Length': d.length || '',
            'Width': d.width || '',
            'Height': d.height || '',
            'Depth %': d.depth_percent || '',
            'Table %': d.table_percent || '',
            'Ratio': d.ratio || '',
            'Cut Grade': d.cut_grade || '',
            'Polish': d.polish || '',
            'Symmetry': d.symmetry || '',
            'Location': d.country
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Diamonds Export');

        // Auto-size columns
        const colWidths = Object.keys(rows[0]).map(key => ({
            wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2
        }));
        worksheet['!cols'] = colWidths;

        XLSX.writeFile(workbook, 'diamonds_export.xlsx');
    };

    const handleEmail = async () => {
        const email = prompt('Enter recipient email:');
        if (!email) return;
        try {
            await axios.post('/api/email', { ids: selectedRows, email });
            alert('Email sent successfully!');
        } catch (err) {
            console.error('Email failed:', err);
            alert('Failed to send email.');
        }
    };

    const toggleSelectRow = (id) => {
        setSelectedRows(prev => 
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };
    const resetFilters = () => {
        setSelectedFilters({
            shape: [], colorFrom: '', colorTo: '', clarityFrom: '', clarityTo: '',
            minWeight: '', maxWeight: '', stockNumber: '',
            minLength: '', maxLength: '', minWidth: '', maxWidth: '',
            fluorescence: '', pairSingle: '',
            location: '', certificate: ''
        });
    };
    return (
        <div className="app-container">
            <aside className="sidebar glass">
                <div className="logo-section">
                    <img src={logo} alt="GS Diamonds" className="logo-img" />
                </div>

                <form className="filter-grid" onSubmit={(e) => { e.preventDefault(); fetchDiamonds(); }}>
                    {/* Column 1 */}
                    <div className="filter-column">
                        <div className="filter-group">
                            <label className="filter-label">Stock number:</label>
                            <input 
                                value={selectedFilters.stockNumber} 
                                onChange={(e) => handleSingleFilterChange('stockNumber', e.target.value)}
                            />
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">Shape:</label>
                            <select 
                                value={selectedFilters.shape[0] || ''} 
                                onChange={(e) => handleSingleFilterChange('shape', e.target.value ? [e.target.value] : [])}
                            >
                                <option value="">-- ALL --</option>
                                {filters?.shapes?.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">Weight:</label>
                            <div className="input-pair">
                                <input placeholder="0" type="number" value={selectedFilters.minWeight} onChange={(e) => handleSingleFilterChange('minWeight', e.target.value)} />
                                <input placeholder="0" type="number" value={selectedFilters.maxWeight} onChange={(e) => handleSingleFilterChange('maxWeight', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Column 2 */}
                    <div className="filter-column">
                        <div className="filter-row">
                            <label>Color:</label>
                            <div className="input-pair">
                                <select value={selectedFilters.colorFrom} onChange={(e) => handleSingleFilterChange('colorFrom', e.target.value)}>
                                    <option value="">-- ALL --</option>
                                    {filters?.colors?.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={selectedFilters.colorTo} onChange={(e) => handleSingleFilterChange('colorTo', e.target.value)}>
                                    <option value="">-- ALL --</option>
                                    {filters?.colors?.slice()?.reverse()?.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="filter-row">
                            <label>Clarity:</label>
                            <div className="input-pair">
                                <select value={selectedFilters.clarityFrom} onChange={(e) => handleSingleFilterChange('clarityFrom', e.target.value)}>
                                    <option value="">-- ALL --</option>
                                    {['VVS', 'VVS1', 'VVS2', 'VS', 'VS1', 'VS2', 'SI', 'SI1', 'SI2', 'SI3', 'I1', 'I2'].map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <select value={selectedFilters.clarityTo} onChange={(e) => handleSingleFilterChange('clarityTo', e.target.value)}>
                                    <option value="">-- ALL --</option>
                                    {[...['VVS', 'VVS1', 'VVS2', 'VS', 'VS1', 'VS2', 'SI', 'SI1', 'SI2', 'SI3', 'I1', 'I2']].reverse().map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="filter-row">
                            <label>Length:</label>
                            <div className="input-pair">
                                <input type="number" value={selectedFilters.minLength} onChange={(e) => handleSingleFilterChange('minLength', e.target.value)} />
                                <input type="number" value={selectedFilters.maxLength} onChange={(e) => handleSingleFilterChange('maxLength', e.target.value)} />
                            </div>
                        </div>
                        <div className="filter-row">
                            <label>Width:</label>
                            <div className="input-pair">
                                <input type="number" value={selectedFilters.minWidth} onChange={(e) => handleSingleFilterChange('minWidth', e.target.value)} />
                                <input type="number" value={selectedFilters.maxWidth} onChange={(e) => handleSingleFilterChange('maxWidth', e.target.value)} />
                            </div>
                        </div>
                        <div className="filter-row">
                            <label>Fluorescence:</label>
                            <select value={selectedFilters.fluorescence} onChange={(e) => handleSingleFilterChange('fluorescence', e.target.value)}>
                                <option value="">-- ALL --</option>
                                {filters?.fluorescence?.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Column 3 */}
                    <div className="filter-column">
                        <div className="filter-row">
                            <label>Pair /Single:</label>
                            <select value={selectedFilters.pairSingle} onChange={(e) => handleSingleFilterChange('pairSingle', e.target.value)}>
                                <option value="">-- ALL --</option>
                                <option value="Pair">Pair</option>
                                <option value="Single">Single</option>
                            </select>
                        </div>
                        <div className="filter-row">
                            <label>Location:</label>
                            <select value={selectedFilters.location} onChange={(e) => handleSingleFilterChange('location', e.target.value)}>
                                <option value="">-- ALL --</option>
                                {filters?.locations?.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className="filter-row">
                            <label>Certificate:</label>
                            <select value={selectedFilters.certificate} onChange={(e) => handleSingleFilterChange('certificate', e.target.value)}>
                                <option value="">-- ALL --</option>
                                {filters?.certificates?.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="filter-actions">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                <Search size={18} /> Apply
                            </button>
                            <button type="button" className="btn btn-secondary" onClick={resetFilters}>
                                Reset
                            </button>
                        </div>
                    </div>
                </form>
            </aside>

            <main className="main-content">
                <header className="header glass">
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            {selectedRows.length} items selected out of {diamonds.length}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            className="btn btn-secondary"
                            onClick={toggleTheme}
                            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        <button 
                            className="btn btn-secondary" 
                            disabled={diamonds.length === 0}
                            onClick={handleExport}
                            title={selectedRows.length > 0 ? `Export ${selectedRows.length} selected` : `Export all ${diamonds.length} results`}
                        >
                            <Download size={18} /> Export{selectedRows.length > 0 ? ` (${selectedRows.length})` : ' All'}
                        </button>
                        <button 
                            className="btn btn-primary" 
                            disabled={selectedRows.length === 0}
                            onClick={handleEmail}
                        >
                            <Mail size={18} /> Email
                        </button>
                    </div>
                </header>

                <div className="inventory-grid" ref={inventoryRef} onScroll={handleScroll}>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input 
                                        type="checkbox" 
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedRows(diamonds?.map(d => d.id) || []);
                                            else setSelectedRows([]);
                                        }}
                                        checked={selectedRows.length === (diamonds?.length || 0) && (diamonds?.length || 0) > 0}
                                    />
                                </th>
                                <th>Stock #</th>
                                <th>Shape</th>
                                <th>Qty</th>
                                <th>Pairing</th>
                                <th>Weight</th>
                                <th>Color</th>
                                <th>Clarity</th>
                                <th>Fluorescence</th>
                                <th>Lab</th>
                                <th>Certificate No.</th>
                                <th>List p/c</th>
                                <th>Total price</th>
                                <th>Length</th>
                                <th>Width</th>
                                <th>Height</th>
                                <th>Depth %</th>
                                <th>Table %</th>
                                <th>Ratio</th>
                                <th>Cut Grade</th>
                                <th>Polish</th>
                                <th>Symmetry</th>
                                <th>Location</th>
                            </tr>
                        </thead>
                        <tbody>
                            {diamonds?.map(d => (
                                <tr key={d.id}>
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedRows.includes(d.id)}
                                            onChange={() => toggleSelectRow(d.id)}
                                        />
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        <a 
                                            href={`https://gs.gsdiamonds.com/StoneDetails.aspx?name=${d.stock_id}`}
                                            className="stock-link"
                                        >
                                            {d.stock_id}
                                        </a>
                                    </td>
                                    <td>{d.shape}</td>
                                    <td>{d.qty}</td>
                                    <td>{d.is_matched_pair}</td>
                                    <td>{d.weight}</td>
                                    <td>{d.color}</td>
                                    <td>{d.clarity}</td>
                                    <td>{d.fluorescence || '-'}</td>
                                    <td>{d.lab || '-'}</td>
                                    <td>{d.certificate}</td>
                                    <td>${parseFloat(d.list_price || 0).toLocaleString()}</td>
                                    <td style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
                                        ${parseFloat(d.total_price).toLocaleString()}
                                    </td>
                                    <td>{d.length || '-'}</td>
                                    <td>{d.width || '-'}</td>
                                    <td>{d.height || '-'}</td>
                                    <td>{d.depth_percent ? `${d.depth_percent}%` : '-'}</td>
                                    <td>{d.table_percent ? `${d.table_percent}%` : '-'}</td>
                                    <td>{d.ratio || '-'}</td>
                                    <td>{d.cut_grade || '-'}</td>
                                    <td>{d.polish || '-'}</td>
                                    <td>{d.symmetry || '-'}</td>
                                    <td>{d.country}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default App;
