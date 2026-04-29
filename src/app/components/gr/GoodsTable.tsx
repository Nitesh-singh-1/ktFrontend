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
          <h3 className="text-lg font-semibold text-gray-800">
            Goods Details
          </h3>
          <p className="text-xs text-gray-500">
            Add items and calculate transport cost
          </p>
        </div>

        <button
          onClick={addRow}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-sm shadow-sm"
        >
          + Add Row
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl border">

        {/* COLUMN HEADER */}
        <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase">
          <div>Article</div>
          <div>Description</div>
          <div>Weight</div>
          <div>Rate</div>
          <div className="text-center">Action</div>
        </div>

        {/* ROWS */}
        <div className="max-h-[350px] overflow-y-auto divide-y">

          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-5 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition"
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

              {/* Action */}
              <div className="flex justify-center">
                <button
                  onClick={() => deleteRow(index)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
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