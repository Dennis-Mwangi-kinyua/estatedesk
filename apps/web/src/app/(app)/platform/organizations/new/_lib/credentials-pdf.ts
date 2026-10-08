import type { CreateOrganizationState } from "../actions";

type Account = NonNullable<CreateOrganizationState["createdAccount"]>;

export async function createCredentialsPdf(account: Account, temporaryPassword: string, loginUrl: string) {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const regular = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
      const mono = await pdf.embedFont(StandardFonts.Courier);
      let page = pdf.addPage([595.28, 841.89]);
      let y = 785;
      const ink = rgb(0.09, 0.15, 0.24);
      function write(text: string, font = regular, size = 11) {
        // Standard PDF fonts cover Latin-1; encode other characters explicitly.
        const printable = text.split("").map((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) > 126 ? `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}` : char).join("");
        let line = "";
        for (const char of printable) {
          if (char === "\n" || font.widthOfTextAtSize(line + char, size) > 485) {
            if (y < 65) { page = pdf.addPage([595.28, 841.89]); y = 785; }
            page.drawText(line, { x: 55, y, font, size, color: ink });
            y -= size + 7;
            line = char === "\n" ? "" : char;
          } else { line += char; }
        }
        if (y < 65) { page = pdf.addPage([595.28, 841.89]); y = 785; }
        page.drawText(line, { x: 55, y, font, size, color: ink });
        y -= size + 10;
      }
      write("EstateDesk", bold, 24);
      write("Account credentials & first-login guide", bold, 16);
      write("CONFIDENTIAL - Share only with the account owner.", bold, 10);
      y -= 15;
      const details = [
        ["Workspace", account.organizationName],
        ["Workspace ID", account.slug],
        ["Account type", account.accountType === "LANDLORD" ? "Landlord" : "Property management agency"],
        ["Account owner", account.fullName],
        ["Sign-in URL", loginUrl],
        ["Username", account.username],
        ["Login email", account.email],
        ["Contact phone", account.phone || "Not provided"],
        ["Plan", account.plan],
        ["Workspace role", "Administrator"],
      ];
      for (const [label, value] of details) { write(label, bold, 10); write(value); }
      write("Temporary password", bold, 10);
      write(temporaryPassword, mono, 12);
      y -= 10;
      write("Getting started", bold, 14);
      write("1. Open the sign-in URL and use your username or email and temporary password.");
      write("2. Change your temporary password when prompted, then complete any required terms acceptance.");
      write("3. Open your workspace and add your first property, units, and team members.");
      write("Keep this document private. Delete it after changing your password. Escaped characters (\\uXXXX) represent Unicode characters in the original details.", regular, 9);
      return pdf.save();

}
