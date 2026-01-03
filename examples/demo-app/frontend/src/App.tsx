import { useState } from 'react'

function App() {
    const [role, setRole] = useState('manager')
    const [amount, setAmount] = useState('500')
    const [response, setResponse] = useState<string | null>(null)

    const makeRequest = async (action: string, resource: string, body: any = {}) => {
        try {
            const res = await fetch(`http://localhost:3001/api/${resource}/${action}`, {
                method: action === 'delete' ? 'DELETE' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-role': role,
                    'x-user-id': 'test-user-1'
                },
                body: JSON.stringify(body)
            })

            const data = await res.json()
            setResponse(JSON.stringify(data, null, 2))
        } catch (err) {
            setResponse('Error: ' + err)
        }
    }

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '800px', margin: '0 auto' }}>
            <h1>EvoPolicy Demo Application</h1>
            <hr style={{ borderColor: '#ddd', marginBottom: '2rem' }} />

            <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #e9ecef' }}>
                <h3>User Context Simulation</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong>Role:</strong>
                    <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ced4da' }}>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="user">User</option>
                        <option value="guest">Guest</option>
                    </select>
                </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={{ border: '1px solid #e9ecef', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3>Invoice Operations</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Policy: Manager can approve if amount &le; 1000</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Amount"
                            style={{ padding: '8px', border: '1px solid #ced4da', borderRadius: '4px', width: '100px' }}
                        />
                        <button
                            onClick={() => makeRequest('approve', 'invoices', { amount: Number(amount) })}
                            style={{ background: '#0d6efd', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Approve Invoice
                        </button>
                    </div>
                </div>



                <div style={{ border: '1px solid #e9ecef', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3>Database Operations</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Policy: Only Admin can delete database</p>
                    <button
                        onClick={() => makeRequest('database', 'api/database'.replace('api/', ''), {})}
                        style={{ marginTop: '1rem', background: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                    >
                        Delete Database
                    </button>
                </div>

                {/* New Advanced Tests */}
                <div style={{ border: '1px solid #e9ecef', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3>Profile Update (Regex)</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Policy: User can update if email matches <code>@company.com</code></p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                        <button
                            onClick={() => makeRequest('update', 'profile', { email: 'test@gmail.com' })}
                            style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Try Invalid Email
                        </button>
                        <button
                            onClick={() => makeRequest('update', 'profile', { email: 'staff@company.com' })}
                            style={{ background: '#198754', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Try Valid Email
                        </button>
                    </div>
                </div>

                <div style={{ border: '1px solid #e9ecef', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3>Article Publish (Date)</h3>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Policy: Editor can publish if date &gt; 2025-01-01</p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                        <button
                            onClick={() => makeRequest('publish', 'articles', { publishDate: '2024-01-01' })}
                            style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Try Past Date
                        </button>
                        <button
                            onClick={() => makeRequest('publish', 'articles', { publishDate: '2025-06-01' })}
                            style={{ background: '#198754', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            Try Future Date
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3>Operation Result</h3>
                <pre style={{ background: '#212529', color: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', overflowX: 'auto', minHeight: '100px' }}>
                    {response || '// Waiting for user action...'}
                </pre>
            </div>
        </div >
    )
}

export default App
