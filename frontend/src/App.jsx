
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, Mail, Diamond, Menu, X } from 'lucide-react';

const App = () => {
    const [diamonds, setDiamonds] = useState([]);
    const [filters, setFilters] = useState({
        shapes: [],
        colors: [],
        clarities: [],
        labs: []
    });
    const [selectedFilters, setSelectedFilters] = useState({
        shape: [],
        color: [],
        clarity: [],
        minWeight: '',
        maxWeight: ''
    });
    const [selectedRows, setSelectedRows] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    const handleFilterChange = (type, value) => {
        setSelectedFilters(prev => {
            const current = prev[type] || [];
            const updated = current.includes(value) 
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [type]: updated };
        });
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

    return (
        <div className="app-container">
            <aside className="sidebar glass">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <Diamond color="var(--accent-color)" size={32} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>INVNTRI</h2>
                </div>
                
                <div className="filter-group">
                    <label className="filter-label">Shape</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {filters.shapes.map(shape => (
                            <button 
                                key={shape}
                                className={`btn btn-secondary ${selectedFilters.shape.includes(shape) ? 'active' : ''}`}
                                onClick={() => handleFilterChange('shape', shape)}
                                style={{ 
                                    padding: '6px 12px', 
                                    fontSize: '0.8rem',
                                    borderColor: selectedFilters.shape.includes(shape) ? 'var(--accent-color)' : 'var(--panel-border)',
                                    background: selectedFilters.shape.includes(shape) ? 'rgba(0, 210, 255, 0.1)' : 'transparent'
                                }}
                            >
                                {shape}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Color</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {filters.colors.map(color => (
                            <button 
                                key={color}
                                className="btn btn-secondary"
                                onClick={() => handleFilterChange('color', color)}
                                style={{ 
                                    padding: '6px 12px', 
                                    fontSize: '0.8rem',
                                    borderColor: selectedFilters.color.includes(color) ? 'var(--accent-color)' : 'var(--panel-border)',
                                    background: selectedFilters.color.includes(color) ? 'rgba(0, 210, 255, 0.1)' : 'transparent'
                                }}
                            >
                                {color}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Weight (Cts)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            placeholder="Min" 
                            type="number"
                            value={selectedFilters.minWeight}
                            onChange={(e) => setSelectedFilters({...selectedFilters, minWeight: e.target.value})}
                        />
                        <input 
                            placeholder="Max" 
                            type="number"
                            value={selectedFilters.maxWeight}
                            onChange={(e) => setSelectedFilters({...selectedFilters, maxWeight: e.target.value})}
                        />
                    </div>
                </div>

                <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={fetchDiamonds}>
                    <Search size={18} /> Apply Filters
                </button>
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
                                            if (e.target.checked) setSelectedRows(diamonds.map(d => d.id));
                                            else setSelectedRows([]);
                                        }}
                                        checked={selectedRows.length === diamonds.length && diamonds.length > 0}
                                    />
                                </th>
                                <th>Stock #</th>
                                <th>Shape</th>
                                <th>Weight</th>
                                <th>Color</th>
                                <th>Clarity</th>
                                <th>Lab</th>
                                <th>List Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {diamonds.map(d => (
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
                                    <td>{d.lab}</td>
                                    <td>${parseFloat(d.list_price).toLocaleString()}</td>
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
