
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, Mail, Diamond, Menu, X, Sun, Moon } from 'lucide-react';
import logo from './logo.gif';

const App = () => {
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
    const [selectedFilters, setSelectedFilters] = useState({
        shape: [],
        colorFrom: '',
        colorTo: '',
        clarityFrom: '',
        clarityTo: '',
        minWeight: '',
        maxWeight: '',
        stockNumber: '',
        minLength: '',
        maxLength: '',
        minWidth: '',
        maxWidth: '',
        fluorescence: '',
        pairSingle: '',
        location: '',
        certificate: ''
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

    const fetchDiamonds = async () => {
        try {
            const res = await axios.get('/api/diamonds', { params: selectedFilters });
            setDiamonds(res.data);
        } catch (err) {
            console.error('Error fetching diamonds:', err);
        }
    };

    const handleSingleFilterChange = (field, value) => {
        setSelectedFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleExport = async () => {
        try {
            const res = await axios.post('/api/export', { ids: selectedRows }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'diamonds_export.xlsx');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Export failed:', err);
        }
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={logo} alt="GS Diamonds" style={{ height: '50px', objectFit: 'contain' }} />
                    </div>
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
                        <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
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
                            disabled={selectedRows.length === 0}
                            onClick={handleExport}
                        >
                            <Download size={18} /> Export
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

                <div className="inventory-grid">
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
                                <th>Weight</th>
                                <th>Color</th>
                                <th>Clarity</th>
                                <th>Lab</th>
                                <th>Location</th>
                                <th>Total</th>
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
                                    <td style={{ fontWeight: 600 }}>{d.stock_id}</td>
                                    <td>{d.shape}</td>
                                    <td>{d.weight}</td>
                                    <td>{d.color}</td>
                                    <td>{d.clarity}</td>
                                    <td>{d.lab || '-'}</td>
                                    <td>{d.country}</td>
                                    <td style={{ color: 'var(--accent-color)', fontWeight: 700 }}>
                                        ${parseFloat(d.total_price).toLocaleString()}
                                    </td>
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
