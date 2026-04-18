import { CrisisResource } from '@/types/chat';

export function CrisisResourceCard({ resource }: { resource: CrisisResource }) {
  return (
    <div className="bg-white border text-gray-800 border-amber-200 rounded-xl p-4 my-2 shadow-sm text-left">
      <h4 className="font-bold text-amber-900 mb-1">{resource.name}</h4>
      <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <a href={`tel:${resource.number.replace(/\D/g, '')}`} className="text-[#E85D9A] font-bold text-lg hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          Call
        </a>
        <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
          {resource.available}
        </span>
      </div>
    </div>
  );
}
