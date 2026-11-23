import React, { useState } from 'react';
import {
  useGetTransactionsQuery,
  useAddTransactionMutation,
  useDeleteTransactionMutation,
  useLoginUserMutation,
  useRegisterUserMutation,
  useGetExchangeRatesQuery,
} from './apiSlice';

function App() {
  const token = localStorage.getItem('token');

  // API hooks
  const {
    data: rawTransactions = [],
    isLoading,
    error: fetchError,
    refetch,
  } = useGetTransactionsQuery(undefined, {
    skip: !token,
  });

  const [addTransaction, { isLoading: isAdding }] = useAddTransactionMutation();
  const [deleteTransaction] = useDeleteTransactionMutation();
  const [loginUser, { isLoading: isLoggingIn }] = useLoginUserMutation();
  const [registerUser, { isLoading: isRegistering }] = useRegisterUserMutation();

  // Third-party API hook for currency exchange rates (skipped if not logged in)
  const { data: exchangeData, isLoading: ratesLoading } = useGetExchangeRatesQuery(
    undefined,
    {
      skip: !token,
    }
  );

  // Normalize transactions array safely regardless of backend response shape
  const transactions = Array.isArray(rawTransactions)
    ? rawTransactions
    : Array.isArray(rawTransactions?.transactions)
      ? rawTransactions.transactions
      : [];

  // Local state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [amount, setAmount] = useState('');
  const [authError, setAuthError] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');

  // Calculate total expenses and converted amounts
  const totalAmount = transactions.reduce(
    (acc, tx) => acc + (Number(tx?.amount) || 0),
    0
  );
  const rate = Number(exchangeData?.rates?.[selectedCurrency]) || 1;
  const convertedTotal = (totalAmount * rate).toFixed(2);

  // Handle Authentication (Login / Register)
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');

    try {
      const trimmedEmail = email.trim();
      const res = isLoginMode
        ? await loginUser({ email: trimmedEmail, password }).unwrap()
        : await registerUser({ name: name.trim(), email: trimmedEmail, password }).unwrap();

      if (res?.token) {
        localStorage.setItem('token', res.token);
        refetch();
      } else {
        window.location.reload();
      }
    } catch (err) {
      setAuthError(
        err?.data?.message ||
          err?.error ||
          'Authentication failed. Please check your details.'
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  // Handle Adding Expense
  const handleSubmitTransaction = async (e) => {
    e.preventDefault();
    setActionError('');

    const trimmedText = text.trim();
    const numericAmount = Number(amount);

    if (!trimmedText || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setActionError('Please enter a valid description and positive amount.');
      return;
    }

    try {
      await addTransaction({
        text: trimmedText,
        amount: numericAmount,
      }).unwrap();
      setText('');
      setAmount('');
    } catch (err) {
      setActionError(
        err?.data?.message || 'Failed to save transaction. Please try again.'
      );
    }
  };

  // Handle Deleting Expense
  const handleDeleteTransaction = async (id) => {
    setActionError('');
    try {
      await deleteTransaction(id).unwrap();
    } catch (err) {
      setActionError(
        err?.data?.message || 'Failed to delete transaction. Please try again.'
      );
    }
  };

  // If NOT logged in, show Auth Screen
  if (!token) {
    const isSubmittingAuth = isLoggingIn || isRegistering;

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
            disabled={isSubmittingAuth}
            style={{
              padding: '0.75rem',
              background: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: isSubmittingAuth ? 'not-allowed' : 'pointer',
              opacity: isSubmittingAuth ? 0.7 : 1,
            }}
          >
            {isSubmittingAuth
              ? 'Please wait...'
              : isLoginMode
                ? 'Login'
                : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          {isLoginMode ? "Don't have an account?" : 'Already have an account?'}{' '}
          <span
            onClick={() => {
              setIsLoginMode(!isLoginMode);
              setAuthError('');
            }}
            style={{
              color: '#4CAF50',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
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

  // If logged in, show Expense Tracker Dashboard
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

      {actionError && (
        <div
          style={{
            color: '#ff6b6b',
            background: '#2d1515',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            border: '1px solid #ff6b6b',
          }}
        >
          {actionError}
        </div>
      )}

      {/* Third-Party Currency Conversion Widget */}
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

      {/* Add Transaction Form */}
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
          step="0.01"
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
          disabled={isAdding}
          style={{
            padding: '0.5rem 1rem',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isAdding ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: isAdding ? 0.7 : 1,
          }}
        >
          {isAdding ? 'Adding...' : 'Add'}
        </button>
      </form>

      {/* Transactions List */}
      <h2>Transactions</h2>
      {isLoading && <p>Loading transactions...</p>}

      {!isLoading && transactions.length === 0 && !fetchError && (
        <p style={{ color: '#888' }}>
          No transactions recorded yet. Add your first expense above!
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {transactions.map((tx) => {
          const txId = tx._id || tx.id;
          return (
            <li
              key={txId}
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
                <span style={{ fontWeight: 'bold' }}>
                  ${Number(tx.amount).toFixed(2)}
                </span>
                <button
                  onClick={() => handleDeleteTransaction(txId)}
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
          );
        })}
      </ul>
    </div>
  );
}

export default App;