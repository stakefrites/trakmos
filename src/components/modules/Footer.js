import { Twitter, Github } from "react-bootstrap-icons";
import PoweredByAkash from "../../assets/powered-by-akash.svg";
const Footer = () => {
  return (
    <footer className="align-items-center py-3 my-4 border-top row">
      <div className="col-md-4 col-sm-12 col-12 mt-2">
        <a
          href="https://akash.network"
          target="_blank"
          rel="noreferrer"
          className="col-md-4 mb-0 text-muted"
        >
          <img src={PoweredByAkash} alt="Powered by Akash" width={200} />
        </a>
      </div>
      <div className="col-lg-6 col-md-6 col-sm-12 col-12 mt-2">
        <span>Built with 🧡&nbsp;by</span>
        <a
          href="https://stakefrites.co/"
          className="link-dark text-decoration-none"
          target="_blank"
          rel="noreferrer"
        >
          Stake Frites (🥩,🍟)&nbsp;
        </a>
        <span>and&nbsp;</span>
        <a
          className="link-dark text-decoration-none"
          href="https://ecostake.com"
          target="_blank"
          rel="noreferrer"
        >
          ECO Stake 🌱
        </a>
      </div>
      <div className="col-lg-2 col-md-2 col-sm-12 col-12 mt-2">
        <a
          href="https://twitter.com/stakefrites_"
          alt="Twitter"
          target="_blank"
          rel="noreferrer"
          className="link-dark text-decoration-none"
        >
          <Twitter color="black" size={24} />
        </a>
        <a
          href="https://github.com/stakefrites"
          alt="Github"
          target="_blank"
          rel="noreferrer"
          style={{ marginLeft: "10px" }}
          className="link-dark text-decoration-none"
        >
          <Github color="black" size={24} />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
