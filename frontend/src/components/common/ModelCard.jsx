import React from "react";

const ModelCard = ({ model, response, onSelect }) => {
	return (
		<div
			onClick={() => onSelect(model, response)}
			className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white h-full"
		>
			<h3 className="font-semibold text-lg mb-2 text-gray-800">{model}</h3>
			<p className="text-gray-600 line-clamp-3">{response}</p>
		</div>
	);
};

export default ModelCard;