import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
}

export const AdminTablePagination: React.FC<AdminTablePaginationProps> = ({
  currentPage,
  totalPages,
  totalResults,
  resultsPerPage,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * resultsPerPage + 1;
  const endIdx = Math.min(currentPage * resultsPerPage, totalResults);

  return (
    <div className="bg-gray-900 border border-gray-800 px-6 py-4 flex items-center justify-between mt-1">
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center px-4 py-2 border border-gray-700 text-xs font-black uppercase tracking-widest bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-700 text-xs font-black uppercase tracking-widest bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
            Showing <span className="text-white">{startIdx}</span> to{' '}
            <span className="text-white">{endIdx}</span> of{' '}
            <span className="text-white">{totalResults}</span> results
          </p>
        </div>
        <div>
          <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 border border-gray-700 bg-gray-800 text-xs font-medium text-gray-500 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              const isCurrent = pageNum === currentPage;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-700 text-xs font-black uppercase tracking-widest transition-colors ${
                    isCurrent
                      ? 'z-10 bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 border border-gray-700 bg-gray-800 text-xs font-medium text-gray-500 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
