'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SupabaseAnalyzerPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [foreignKeys, setForeignKeys] = useState<any[]>([]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      
      // Get list of tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .not('table_name', 'like', 'pg_%');
      
      if (tablesError) throw tablesError;
      
      const tableNames = tablesData.map(t => t.table_name);
      setTables(tableNames);
      
      // Get foreign key relationships
      const { data: fkData, error: fkError } = await supabase
        .from('information_schema.key_column_usage')
        .select(`
          constraint_name,
          table_name,
          column_name,
          referenced_table_name:information_schema.referential_constraints!inner(referenced_table_name)
        `)
        .eq('table_schema', 'public')
        .not('referenced_table_name', 'is', null);
      
      if (fkError) throw fkError;
      
      setForeignKeys(fkData);
      
    } catch (err: any) {
      console.error('Error fetching schema:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeTable = async (tableName: string) => {
    try {
      setLoading(true);
      setSelectedTable(tableName);
      setResults([]);
      
      // Get table columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
      
      if (columnsError) throw columnsError;
      
      // Find foreign key relationships for this table
      const tableRelationships = foreignKeys.filter(fk => 
        fk.table_name === tableName || 
        fk.referenced_table_name?.referenced_table_name === tableName
      );
      
      // Generate test queries for each relationship
      const testQueries = [];
      
      // This table has foreign keys to other tables
      for (const fk of tableRelationships.filter(fk => fk.table_name === tableName)) {
        const referencedTable = fk.referenced_table_name?.referenced_table_name;
        if (referencedTable) {
          testQueries.push({
            name: `${tableName} with ${referencedTable} (incorrect)`,
            query: `.from('${tableName}').select('*, ${referencedTable}(*)')`,
            correct: false,
            relationship: `${tableName}.${fk.column_name} -> ${referencedTable}`
          });
          
          testQueries.push({
            name: `${tableName} with ${referencedTable} (correct)`,
            query: `.from('${tableName}').select('*, ${referencedTable}:${referencedTable}(*)')`,
            correct: true,
            relationship: `${tableName}.${fk.column_name} -> ${referencedTable}`
          });
        }
      }
      
      // Other tables have foreign keys to this table
      for (const fk of tableRelationships.filter(fk => fk.referenced_table_name?.referenced_table_name === tableName)) {
        const sourceTable = fk.table_name;
        testQueries.push({
          name: `${sourceTable} with ${tableName} (incorrect)`,
          query: `.from('${sourceTable}').select('*, ${tableName}(*)')`,
          correct: false,
          relationship: `${sourceTable}.${fk.column_name} -> ${tableName}`
        });
        
        testQueries.push({
          name: `${sourceTable} with ${tableName} (correct)`,
          query: `.from('${sourceTable}').select('*, ${tableName}:${tableName}(*)')`,
          correct: true,
          relationship: `${sourceTable}.${fk.column_name} -> ${tableName}`
        });
      }
      
      setResults(testQueries);
      
    } catch (err: any) {
      console.error('Error analyzing table:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const runTestQuery = async () => {
    try {
      setTestLoading(true);
      setTestResult(null);
      setTestError(null);
      
      // Execute the query using eval (be careful with this in production!)
      const queryFunction = new Function('supabase', `
        return supabase${testQuery}.limit(5);
      `);
      
      const query = queryFunction(supabase);
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setTestResult({
        data,
        count,
        rowCount: data?.length || 0
      });
      
    } catch (err: any) {
      console.error('Error running test query:', err);
      setTestError(err.message);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Supabase Query Analyzer</h1>
            <div className="flex space-x-4">
              <Link 
                href="/diagnostic" 
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Diagnostic Tool
              </Link>
              <Link 
                href="/" 
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            This tool helps identify and fix the "JSON object requested, multiple (or no) rows returned" error
            by analyzing your Supabase queries and suggesting correct syntax for nested relationships.
          </p>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">1. Select a table to analyze</h2>
            
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {tables.map(table => (
                  <button
                    key={table}
                    onClick={() => analyzeTable(table)}
                    className={`px-4 py-2 rounded-md text-sm ${
                      selectedTable === table 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    {table}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {results.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                2. Potential queries for {selectedTable}
              </h2>
              
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Relationships:</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600">
                  {[...new Set(results.map(r => r.relationship))].map(rel => (
                    <li key={rel}>{rel}</li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    className={`border rounded-md p-4 ${
                      result.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-medium ${result.correct ? 'text-green-800' : 'text-red-800'}`}>
                        {result.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        result.correct ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {result.correct ? 'Correct Syntax' : 'Incorrect Syntax'}
                      </span>
                    </div>
                    
                    <div className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto mb-3">
                      <code className="text-sm font-mono">supabase{result.query}</code>
                    </div>
                    
                    <button
                      onClick={() => {
                        setTestQuery(result.query);
                        runTestQuery();
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Test Query
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">3. Test a custom query</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Query (starting after "supabase")
              </label>
              <div className="flex">
                <div className="bg-gray-100 px-3 py-2 rounded-l-md border border-r-0 border-gray-300">
                  <code className="text-sm font-mono">supabase</code>
                </div>
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder='.from("orders").select("*, customers:customers(*)")'
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={runTestQuery}
              disabled={testLoading || !testQuery}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {testLoading ? 'Running...' : 'Run Query'}
            </button>
            
            {testError && (
              <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{testError}</p>
                    {testError.includes('JSON object requested') && (
                      <p className="text-sm text-red-700 mt-2">
                        <strong>Fix:</strong> Change your query to use the format <code className="bg-red-100 px-1">table:table(*)</code> instead of <code className="bg-red-100 px-1">table(*)</code>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {testResult && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-900 mb-2">Query Results:</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Rows returned:</strong> {testResult.rowCount}
                  </p>
                  <div className="overflow-x-auto">
                    <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded-md">
                      {JSON.stringify(testResult.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-blue-900 mb-2">How to fix "JSON object requested" errors</h2>
            <div className="space-y-3 text-sm text-blue-800">
              <p>
                The error "JSON object requested, multiple (or no) rows returned" occurs when Supabase tries to return a nested object
                but the query doesn't properly specify the relationship.
              </p>
              <p>
                <strong>Incorrect syntax:</strong> <code className="bg-blue-100 px-1">.select('*, customers(*)')</code>
              </p>
              <p>
                <strong>Correct syntax:</strong> <code className="bg-blue-100 px-1">.select('*, customers:customers(*)')</code>
              </p>
              <p>
                The colon notation tells Supabase to return the nested data as a JSON object with the specified key.
                This is particularly important when using the <code className="bg-blue-100 px-1">.single()</code> method.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
