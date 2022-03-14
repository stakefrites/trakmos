import StakeFriteLogoLong from "../../assets/Logo_Stake_house_VF_150.png";

function Header(props) {
  return (
    <header className="d-flex flex-wrap justify-content-between py-3 mb-4 border-bottom">
      <div className="logo d-flex align-items-center mb-3 mb-md-0 text-dark text-decoration-none">
        <img src={StakeFriteLogoLong} height="75" alt="Stake Frites" />
      </div>
      <div className="invisible d-flex align-items-center mb-3 mb-md-0 text-dark text-decoration-none"></div>
    </header>
  );
}

export default Header;
