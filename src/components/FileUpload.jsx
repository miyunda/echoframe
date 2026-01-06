import React, { useCallback } from 'react';
import { Upload, CheckCircle2 } from 'lucide-react';

export default function FileUpload({ type, accept, icon, label, file, onUpload }) {
    const handleChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            onUpload(selectedFile);
        }
    };

    return (
        <div className="w-full">
            <label className="group relative flex flex-col items-center justify-center h-48 sm:h-64 glass upload-dashed cursor-pointer transition-all duration-300 hover:bg-surface/50 hover:scale-[1.01] active:scale-[0.99]">
                <input
                    type="file"
                    className="hidden"
                    accept={accept}
                    onChange={handleChange}
                />

                <div className="flex flex-col items-center gap-4 text-center px-4">
                    <div className="p-4 rounded-full bg-overlay group-hover:bg-surface transition-colors duration-300">
                        {file ? <CheckCircle2 className="w-8 h-8 text-pine animate-in zoom-in duration-300" /> : icon}
                    </div>
                    <div className="space-y-1">
                        <p className="text-text font-bold text-lg leading-none">{label}</p>
                        <p className="text-subtle text-xs font-mono uppercase tracking-tighter">
                            {file ? file.file.name : `点击或拖拽上传${type === 'image' ? '图片' : '音频'}`}
                        </p>
                    </div>
                </div>
            </label>
        </div>
    );
}
