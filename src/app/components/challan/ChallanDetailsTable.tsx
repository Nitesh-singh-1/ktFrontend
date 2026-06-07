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
          <h3 className="text-lg font-semibold text-gray-800">
            Challan Details
          </h3>
          <p className="text-xs text-gray-500">
            Add individual consignments for this trip
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
        <div className="grid grid-cols-8 gap-4 px-4 py-2 text-xs font-medium text-gray-500 uppercase">
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
        <div className="max-h-[350px] overflow-y-auto divide-y">

          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-8 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition"
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
