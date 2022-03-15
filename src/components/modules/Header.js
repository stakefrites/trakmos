import StakeFriteLogoLong from "../../assets/Logo_Stake_house_VF_150.png";
import StakeFriteLogo from "../../assets/Sigle_Stake_house@2x.png";

function Header(props) {
  return (
    <header className="d-flex flex-wrap justify-content-between py-3 mb-4 border-bottom">
      <div className="logo d-flex align-items-center mb-3 mb-md-0 text-dark text-decoration-none">
        <img src={StakeFriteLogo} height="75" alt="Stake Frites" />{" "}
        <h2>Trakmos</h2>
      </div>
      <div className="invisible d-flex align-items-center mb-3 mb-md-0 text-dark text-decoration-none"></div>
    </header>
  );
}

export default Header;
