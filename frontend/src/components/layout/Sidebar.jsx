import React from 'react';
import { Menu, Search, ExternalLink, Network } from 'lucide-react';

const Sidebar = () => {
    return (
        <div className="w-64 h-full overflow-y-auto bg-gray-100 p-4 flex-shrink-0">
            {/* Header */}
            <div className="flex items-center justify-end gap-2 mb-8">
                <button className="p-1 rounded hover:bg-gray-200 transition-colors">
                    <Menu className="w-6 h-6"/>
                </button>
                <button className="p-1 rounded hover:bg-gray-200 transition-colors">
                    <Search className="w-6 h-6"/>
                </button>
                <button className="p-1 rounded hover:bg-gray-200 transition-colors">
                    <ExternalLink className="w-6 h-6"/>
                </button>
                <button className="p-1 rounded hover:bg-gray-200 transition-colors">
                    <Network className="w-6 h-6"/>
                </button>
            </div>

            {/* Navigation Sections */}
            <div className="space-y-8">
                <div>
                    <h2 className="text-sm font-semibold mb-4">최근</h2>
                    <nav className="space-y-2">
                        {[1, 2, 3, 4].map((item) => (
                          <button
                            key={item}
                            type="button"
                            className="w-full"
                          >
                            <div className="h-6 bg-gray-200 rounded hover:bg-gray-300 transition-colors"></div>
                          </button>
                        ))}
                    </nav>
                </div>

                <div>
                    <h2 className="text-sm font-semibold mb-4">지난 7일</h2>
                    <nav className="space-y-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                          <button
                            key={item}
                            type="button"
                            className="w-full"
                          >
                            <div className="h-6 bg-gray-200 rounded hover:bg-gray-300 transition-colors"></div>
                          </button>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;