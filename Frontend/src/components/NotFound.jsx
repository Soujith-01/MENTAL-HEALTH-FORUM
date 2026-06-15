import { Link } from "react-router";
import { pageBackground, pageWrapper, cardClass, pageTitleClass, bodyText, primaryBtn } from "../styles/common";

function NotFound() {
  return (
    <div className={pageBackground}>
      <div className={pageWrapper}>
        <div className={cardClass}>
          <h1 className={pageTitleClass}>404</h1>
          <p className={`${bodyText} mt-4`}>The page you requested does not exist.</p>
          <div className="mt-6">
            <Link to="/" className={primaryBtn}>
              Back Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;

