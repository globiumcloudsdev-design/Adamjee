Jani, Fee Vouchers generate karte waqt teeno Fee Types (Monthly, Installments, aur Lump Sum) ka flow bohot simple aur logical hai. Aaiye dono ka overview dekhte hain:

1. Teeno Fee Types ka Flow 💡
Lump Sum (Aik Saath Payment):

Concept: Student pure saal (12 months) ki fee aik saath advance pay karta hai.
Calculation: (Tamam Subjects ki Monthly Fees ka Total × 12) - Discount.
Rule: Pooray Academic Year mein student ka sirf Aik (1) Lump Sum voucher ban sakta hai. Agar pehle se bana hua hai, to system skip kar deta hai.
Installment (Qistoon mein Payment):

Concept: Total saalana fee ko mukhtalif hisson (2, 4, 6 installments) mein baant diya jata hai.
Calculation: ((Tamam Subjects ki Monthly Fees ka Total × 12) - Discount) ÷ Qistoon ki Tadaad (Installment Count).
Rule: Ye voucher auto-increment hota hai. Agar kisi student ki pehle 2 installments ban chuki hain, to agli generation par Installment #3 auto-assign ho jayegi jab tak count pura nahi hota.
Monthly (Mahana Payment):

Concept: Har mahine ki regular fee.
Calculation: Tamam Subjects ki Monthly Fees ka Total - Mahana Discount.
Rule: Har specific maheenay (e.g., May 2026) ka sirf aik hi voucher allowed hai.
2. Generate API (POST /api/fee-vouchers) ka Internal Flow 🚀
Jab aap UI se generate button dabate hain:

Filters Mapping: API filter uthati hai (ke voucher Single Student ka banna hai, Group ka, Class ka ya pure Branch ka).
Fetch Students: Target students nikaalay jaate hain database se.
Memory Check Optimization: Tamam students ke puranay vouchers ko backend pe aik hi baar query karke memory map bana liya jata hai (jis se performance 100x fast hojati hai).
Smart Generator: Har student ka loop chalta hai, wahan dekha jata hai ke student ki apni profile mein Fee Type kia mention hai (Monthly/LumpSum/Installment) aur usi hisab se upar di gayi calculation perform karke voucher database mein save ho jata hai!
Umeed hai apko poora logic clear hogaya hoga jani!