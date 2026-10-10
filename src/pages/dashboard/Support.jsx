import NotBuilt from "../../components/dash/NotBuilt.jsx";

/**
 * There is no ticketing API. The page showed mock tickets with mock
 * response times, which is a promise about support that nothing keeps.
 */
export default function Support() {
  return (
    <NotBuilt
      icon="headset"
      title="Support"
      sub="In-app support tickets are not built yet."
      instead="email team@kribblecare.com. During the pilot you have a direct
        line to the people building this."
    />
  );
}
