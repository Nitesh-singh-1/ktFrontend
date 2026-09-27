import Input from "@/app/components/ui/Input";
import Select from "@/app/components/ui/Select";
import { ChallanDetailRow, billTypes } from "@/types/challan";

export default function ChallanDetailsTable({
  rows,
  addRow,
  deleteRow,
  handleChange,
}: {
  rows: ChallanDetailRow[];
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
            Challan Details
          </h3>
          <p className="text-xs text-[#64748B] dark:text-slate-400">
            Add individual consignments for this trip
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
        <div className="grid grid-cols-8 gap-4 px-4 py-2.5 text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase bg-[#F7F8F8] dark:bg-slate-800/60 border-b border-[#E5EAEB] dark:border-slate-700">
          <div>Bill No</div>
          <div>Quantity</div>
          <div>Destination</div>
          <div>Freight Amount</div>
          <div>Bill Type</div>
          <div>Consignee Name</div>
          <div>Remarks</div>
          <div className="text-center">Action</div>
        </div>

        {/* ROWS */}
        <div className="max-h-[350px] overflow-y-auto divide-y divide-[#E5EAEB] dark:divide-slate-800">

          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-8 gap-4 px-4 py-3 items-center hover:bg-[#F5FAFA] dark:hover:bg-slate-800/40 transition"
            >
              {/* Bill No */}
              <Input
                className="bg-gray-50"
                value={row.billNo}
                onChange={(e) =>
                  handleChange(index, "billNo", e.target.value)
                }
              />

              {/* Quantity */}
              <Input
                className="bg-gray-50"
                inputMode="numeric"
                value={row.quantity || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  handleChange(index, "quantity", val ? Number(val) : 0);
                }}
              />

              {/* Destination */}
              <Input
                className="bg-gray-50"
                value={row.destination}
                onChange={(e) =>
                  handleChange(index, "destination", e.target.value)
                }
              />

              {/* Freight Amount */}
              <Input
                className="bg-gray-50"
                inputMode="numeric"
                value={row.freightAmount || ""}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  handleChange(index, "freightAmount", val ? Number(val) : 0);
                }}
              />

              {/* Bill Type */}
              <Select
                className="bg-gray-50"
                value={row.billTypeId?.toString() || ""}
                onChange={(e) =>
                  handleChange(index, "billTypeId", Number(e.target.value))
                }
                options={[
                  { label: "Select Type", value: "" },
                  ...billTypes.map((type) => ({
                    label: type.name,
                    value: type.id.toString(),
                  })),
                ]}
              />

              {/* Consignee Name */}
              <Input
                className="bg-gray-50"
                value={row.consigneeName}
                onChange={(e) =>
                  handleChange(index, "consigneeName", e.target.value)
                }
              />

              {/* Remarks */}
              <Input
                className="bg-gray-50"
                value={row.remarks}
                onChange={(e) =>
                  handleChange(index, "remarks", e.target.value)
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
