import React from 'react';

// These buttons only collect a click. main.tsx decides what happens next.

export function ImportButton({ onFile }: { onFile: (file: File) => void }) {
    return (
        <button
            type="button"
            onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv';
                input.onchange = (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (file) {
                        onFile(file);
                    }
                };
                input.click();
            }}
        >
            Import CSV
        </button>
    );
}

export function ClearButton({ onClear }: { onClear: () => void }) {
    return (
        <button type="button" onClick={onClear}>
            Clear Graph
        </button>
    );
}
