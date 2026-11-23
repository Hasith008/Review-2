import React, { useState } from 'react';
import {
  useGetTransactionsQuery,
  useAddTransactionMutation,
  useDeleteTransactionMutation,
  useLoginUserMutation,
  useRegisterUserMutation,
  useGetExchangeRatesQuery,
} from './features/apiSlice';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  const {
    data: transactions = [],
    isLoading,
    error: fetchError,
    refetch,
  } = useGetTransactionsQuery(undefined, {
    skip: !token,
  });

  const [addTransaction] = useAddTransactionMutation();
  const [deleteTransaction] = useDeleteTransactionMutation();
  const [loginUser] = useLoginUserMutation();
  const [registerUser] = useRegisterUserMutation();

  const { data: exchangeData, isLoading: ratesLoading } = useGetExchangeRatesQuery(
    undefined,
    {
      skip: !token,
    }
  );

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [authError, setAuthError] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');

  const txList = Array.isArray(transactions) ? transactions : [];
  const totalAmount = txList.reduce((acc, tx) => acc + Number(tx.amount || 0), 0);
  const rate = Number(exchangeData?.rates?.[selectedCurrency]) || 1;
  const convertedTotal = (totalAmount * rate).toFixed(2);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = isLoginMode
        ? await loginUser({ email, password }).unwrap()
        : await registerUser({ name, email, password }).unwrap();

      if (res?.token) {
        localStorage.setItem('token', res.token);
        setToken(res.token);
        refetch();
      } else {
        setAuthError('Login succeeded, but no token was returned by the server.');
      }
    } catch (err) {
      setAuthError(
        err?.data?.message || 'Authentication failed. Please check your details.'
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!text.trim() || Number.isNaN(numericAmount)) return;

    try {
      await addTransaction({
        text: text.trim(),
        amount: numericAmount,
      }).unwrap();
      setText('');
      setAmount('');
    } catch (err) {
      console.error('Failed to save transaction:', err);
    }
  };

  if (!token) {
    return (
      <div
        style={{
          padding: '2rem',
          maxWidth: '400px',
          margin: '4rem auto',
          color: '#e0e0e0',
          background: '#121212',
          borderRadius: '8px',
          fontFamily: 'Segoe UI, sans-serif',
        }}
      >
        <h2 style={{ textAlign: 'center', color: '#fff' }}>
          {isLoginMode ? 'Login to Expense Tracker' : 'Create Account'}
        </h2>

        {authError && (
          <div
            style={{
              color: '#ff6b6b',
              background: '#2d1515',
              padding: '0.75rem',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}
          >
            {authError}
          </div>
        )}

        <form
          onSubmit={handleAuth}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {!isLoginMode && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #444',
                background: '#2a2a2a',
                color: '#fff',
              }}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#2a2a2a',
              color: '#fff',
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #444',
              background: '#2a2a2a',
              color: '#fff',
            }}
            required
          />
          <button
            type="submit"
            style={{
              padding: '0.75rem',
              background: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {isLoginMode ? 'Login' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          {isLoginMode ? "Don't have an account?" : 'Already have an account?'}{' '}
          <span
            onClick={() => {
              setAuthError('');
              setIsLoginMode(!isLoginMode);
            }}
            style={{ color: '#4CAF50', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLoginMode ? 'Register here' : 'Login here'}
          </span>
        </p>
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.8rem',
            color: '#888',
            marginTop: '1rem',
          }}
        >
          Default Admin: admin@gmail.com / admin123
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'Segoe UI, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        color: '#e0e0e0',
        background: '#121212',
        minHeight: '100vh',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h1 style={{ margin: 0, color: '#fff' }}>Expense Tracker</h1>
        <button
          onClick={handleLogout}
          style={{
            background: '#e53935',
            color: '#fff',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Logout
        </button>
      </div>

      {fetchError && (
        <div
          style={{
            color: '#ff6b6b',
            background: '#2d1515',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            border: '1px solid #ff6b6b',
          }}
        >
          <p style={{ margin: 0, fontWeight: 'bold' }}>Authorization Error</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            Please try logging out and logging back in.
          </p>
        </div>
      )}

      <div
        style={{
          background: '#1e1e1e',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          border: '1px solid #333',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>
            Total Expenses (USD)
          </p>
          <h3 style={{ margin: '0.2rem 0 0 0', color: '#fff' }}>
            ${totalAmount.toFixed(2)}
          </h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>
            Converted Amount
          </p>
          <h3 style={{ margin: '0.2rem 0 0 0', color: '#4CAF50' }}>
            {ratesLoading ? 'Loading...' : `${convertedTotal} ${selectedCurrency}`}
          </h3>
        </div>
        <div>
          <label
            style={{
              fontSize: '0.8rem',
              display: 'block',
              marginBottom: '0.25rem',
              color: '#aaa',
            }}
          >
            Currency:
          </label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            style={{
              padding: '0.4rem',
              borderRadius: '4px',
              background: '#2a2a2a',
              color: '#fff',
              border: '1px solid #444',
            }}
          >
            <option value="EUR">EUR (€)</option>
            <option value="INR">INR (₹)</option>
            <option value="GBP">GBP (£)</option>
            <option value="CAD">CAD ($)</option>
            <option value="AUD">AUD ($)</option>
            <option value="JPY">JPY (¥)</option>
          </select>
        </div>
      </div>

      <form
        onSubmit={handleSubmitTransaction}
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          background: '#1e1e1e',
          padding: '1rem',
          borderRadius: '8px',
        }}
      >
        <input
          type="text"
          placeholder="Expense description..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            flex: 2,
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #444',
            background: '#2a2a2a',
            color: '#fff',
          }}
          required
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #444',
            background: '#2a2a2a',
            color: '#fff',
          }}
          required
        />
        <button
          type="submit"
          style={{
            padding: '0.5rem 1rem',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Add
        </button>
      </form>

      <h2>Transactions</h2>
      {isLoading && <p>Loading transactions...</p>}

      {!isLoading && txList.length === 0 && !fetchError && (
        <p style={{ color: '#888' }}>
          No transactions recorded yet. Add your first expense above!
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {txList.map((tx) => (
          <li
            key={tx._id || tx.id}
            style={{
              background: '#1e1e1e',
              padding: '0.75rem 1rem',
              marginBottom: '0.5rem',
              borderRadius: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: '4px solid #4CAF50',
            }}
          >
            <span>{tx.text}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontWeight: 'bold' }}>${tx.amount}</span>
              <button
                onClick={() => deleteTransaction(tx._id || tx.id)}
                style={{
                  background: '#e53935',
                  color: 'white',
                  border: 'none',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                X
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;