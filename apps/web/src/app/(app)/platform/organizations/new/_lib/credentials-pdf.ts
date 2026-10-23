import type { CreateOrganizationState } from "../actions";

type Account = NonNullable<CreateOrganizationState["createdAccount"]>;

export async function createCredentialsPdf(account: Account, loginUrl: string) {
      const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
      const pdf = await PDFDocument.create();
      const regular = await pdf.embedFont(StandardFonts.Helvetica);
      const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
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
      if (account.temporaryPassword) {
        write("Temporary password (change immediately after first sign-in)", bold, 10);
        write(account.temporaryPassword);
      } else {
        write("Set your password (single use, expires in one hour)", bold, 10);
        write(account.setupUrl ?? "Request a password link from your administrator.");
      }
      y -= 10;
      write("Getting started", bold, 14);
      if (account.temporaryPassword) {
        write("1. Verify your login email.");
        write("2. Sign in with the temporary password and choose a new password when prompted.");
      } else {
        write("1. Open the setup link and choose your own password. Verify your email.");
        write("2. Sign in with your username or email, then complete any required terms acceptance.");
      }
      write("3. Open your workspace and add your first property, units, and team members.");
      write("Keep this document private. Delete it after setting your password. Escaped characters (\\uXXXX) represent Unicode characters in the original details.", regular, 9);
      return pdf.save();

}
