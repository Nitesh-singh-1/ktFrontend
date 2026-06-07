// src/components/gr/ChargesTable.tsx

import Input from "@/app/components/ui/Input";

type Charges = {
  freight: number;
  sCharge: number;
  ddCharge: number;
  hamali: number;
  other: number;
  stCharge: number;
  grandTotal: number;
};

export default function ChargesTable({
  charges,
  setCharges,
}: {
  charges: Charges;
  setCharges: (val: Charges) => void;
}) {
  const handleChange = (field: keyof Charges, value: number) => {
    const updated = {
      ...charges,
      [field]: value,
    };

    // auto calculate grand total
    updated.grandTotal =
      updated.freight +
      updated.sCharge +
      updated.ddCharge +
      updated.hamali +
      updated.other +
      updated.stCharge;

    setCharges(updated);
  };

  return (
    <div className="bg-white border rounded-xl overflow-hidden">

      {/* HEADER */}
      <div className="grid grid-cols-7 text-xs font-medium text-gray-500 uppercase bg-gray-50 px-4 py-2">
        <div>Freight</div>
        <div>S.Charge</div>
        <div>D.D Charge</div>
        <div>Hamali</div>
        <div>Other</div>
        <div>St.Charge</div>
        <div>Grand Total</div>
      </div>

      {/* VALUES */}
      <div className="grid grid-cols-7 gap-3 px-4 py-3 items-center">

        <Input
          inputMode="numeric"
          value={charges.freight || ""}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, "");
            handleChange("freight", val ? Number(val) : 0);
          }}
          className="bg-gray-50"
        />

        <Input
          inputMode="numeric"
          value={charges.sCharge || ""}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, "");
            handleChange("sCharge", val ? Number(val) : 0);
          }}
          className="bg-gray-50"
        />

        <Input
          inputMode="numeric"
          value={charges.ddCharge || ""}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, "");
            handleChange("ddCharge", val ? Number(val) : 0);
          }}
          className="bg-gray-50"
        />

        <Input
          inputMode="numeric"
          value={charges.hamali || ""}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, "");
            handleChange("hamali", val ? Number(val) : 0);
          }}
          className="bg-gray-50"
        />

        <Input
          inputMode="numeric"
          value={charges.other || ""}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, "");
            handleChange("other", val ? Number(val) : 0);
          }}
          className="bg-gray-50"
        />

        <Input
          inputMode="numeric"
          value={charges.stCharge || ""}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9.]/g, "");
            handleChange("stCharge", val ? Number(val) : 0);
          }}
          className="bg-gray-50"
          disabled
        />

        <Input
          value={charges.grandTotal}
          readOnly
          className="bg-gray-100 font-semibold"
        />
      </div>
    </div>
  );
}