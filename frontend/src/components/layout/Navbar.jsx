import React from 'react';
import { Menu, Search, ExternalLink, Star } from 'lucide-react';

const Sidebar = () => {
    return (
        <div className="w-64 h-screen bg-gray-100 p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-8">
                <Menu className="w-6 h-6" />
                <Search className="w-6 h-6" />
                <ExternalLink className="w-6 h-6" />
                <Star className="w-6 h-6" />
            </div>

            {/* Navigation Sections */}
            <div className="space-y-8">
                <div>
                    <h2 className="text-sm font-semibold mb-4">최근</h2>
                    <nav className="space-y-2">
                        {[1, 2, 3, 4].map((item) => (
                            <div key={item} className="h-6 bg-gray-200 rounded"></div>
                        ))}
                    </nav>
                </div>

                <div>
                    <h2 className="text-sm font-semibold mb-4">지난 일</h2>
                    <nav className="space-y-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                            <div key={item} className="h-6 bg-gray-200 rounded"></div>
                        ))}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;