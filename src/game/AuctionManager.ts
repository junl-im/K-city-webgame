export class AuctionManager {
  private listings: any[] = [];
  async load() { this.listings = []; }
  getListings() { return this.listings; }
}