import { Browser, Page } from 'playwright';
import '@cucumber/cucumber';

declare module '@cucumber/cucumber' {
  interface IWorld {
    browser?: Browser;
    page?: Page;
  }
}
