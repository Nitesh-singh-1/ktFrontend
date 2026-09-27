import Input from "@/app/components/ui/Input";
import { GoodsRow } from "@/types/gr";

export default function GoodsTable({
  rows,
  addRow,
  deleteRow,
  handleChange,
}: {
  rows: GoodsRow[];
  addRow: () => void;
  deleteRow: (index: number) => void;
  handleChange: any;
}) {
  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-[#111827] dark:text-white">
            Goods Details
          </h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Add items and calculate transport cost
          </p>
        </div>

        <button
          onClick={addRow}
          className="bg-[#2F8E86] hover:bg-[#25776F] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer transition"
        >
          + Add Row
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#E5EAEB] dark:border-slate-800 shadow-xs overflow-hidden">

        {/* COLUMN HEADER */}
        <div className="grid grid-cols-6 gap-4 px-4 py-2.5 text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-700">
          <div>Number Of Package</div>
          <div>Description</div>
          <div>Weight</div>
          <div>Rate</div>
          <div>Private Marker</div>
          <div className="text-center">Action</div>
        </div>

        {/* ROWS */}
        <div className="max-h-[350px] overflow-y-auto divide-y divide-[#E5EAEB] dark:divide-slate-800">

          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-6 gap-4 px-4 py-3 items-center hover:bg-[#F5FAFA] dark:hover:bg-slate-800/40 transition"
            >
              {/* Article */}
              <Input
                className="bg-gray-50"
                value={row.article}
                onChange={(e) =>
                  handleChange(index, "article", e.target.value)
                }
              />

              {/* Description */}
              <Input
                className="bg-gray-50"
                value={row.description}
                onChange={(e) =>
                  handleChange(index, "description", e.target.value)
                }
              />

              {/* Weight */}
              <Input
                className="bg-gray-50"
                inputMode="numeric"
                value={row.weight || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  handleChange(index, "weight", val ? Number(val) : 0);
                }}
              />

              {/* Rate */}
              <Input
                className="bg-gray-50"
                inputMode="numeric"
                value={row.rate || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  handleChange(index, "rate", val ? Number(val) : 0);
                }}
              />

              {/* Private Marker */}
              <Input
                className="bg-gray-50"
                value={row.privateMarker || ""}
                onChange={(e) =>
                  handleChange(index, "privateMarker", e.target.value)
                }
              />

              {/* Action */}
              <div className="flex justify-center">
                <button
                  onClick={() => deleteRow(index)}
                  className="text-[#94A3B8] hover:text-[#D95C5C] text-xs font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}