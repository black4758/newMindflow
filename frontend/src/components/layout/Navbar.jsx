import React from "react";
import { User } from 'lucide-react';

const Navbar = () => {
	return (
		<nav className="bg-white px-10 py-2.5">
			<div className="flex justify-end items-center">
				<div>
					<span className="px-4">사용자</span>
				</div>
				<div className="flex items-center">
					<button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
						<User className="h-6 w-6 text-gray-600"/>
					</button>
				</div>
			</div>

		</nav>
	);
};

export default Navbar;
