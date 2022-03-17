import StakeFriteLogoLong from "../../assets/Logo_Stake_house_VF_150.png";
import StakeFriteLogo from "../../assets/Sigle_Stake_house@2x.png";
import { Badge } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";

const resizeAddress = (address) => {
  const prefix = address.slice(0, 8);
  const suffix = address.slice(address.length - 8);
  return prefix + "..." + suffix;
};

function Header(props) {
  const navigate = useNavigate();
  return (
    <header className="d-flex flex-wrap justify-content-between py-3 mb-4 border-bottom">
      <div className="logo d-flex align-items-center mb-3 mb-md-0 text-dark text-decoration-none">
        <img
          onClick={() => navigate("/")}
          src={StakeFriteLogo}
          height="75"
          alt="Stake Frites"
        />{" "}
        <h2>Trakmos</h2>
      </div>
      <div className="invisible d-flex align-items-center mb-3 mb-md-0 text-dark text-decoration-none"></div>
      <div>
        {props.address ? (
          <Badge bg="success">{resizeAddress(props.address)}</Badge>
        ) : (
          ""
        )}
      </div>
    </header>
  );
}

export default Header;
