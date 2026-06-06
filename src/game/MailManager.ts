export class MailManager {
  private mails: any[] = [];
  async load() { this.mails = []; }
  getMails() { return this.mails; }
}