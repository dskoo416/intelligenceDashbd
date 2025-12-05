import Saved from './pages/Saved';
import IntelligenceFeed from './pages/IntelligenceFeed';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Saved": Saved,
    "IntelligenceFeed": IntelligenceFeed,
}

export const pagesConfig = {
    mainPage: "Saved",
    Pages: PAGES,
    Layout: __Layout,
};