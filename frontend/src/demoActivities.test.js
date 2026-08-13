import assert from "node:assert/strict";
import test from "node:test";
import polyline from "@mapbox/polyline";
import demoActivities from "./demoActivities.js";

const GOOGLE_EXAMPLE_POLYLINE = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
const mappedActivities = demoActivities.filter(
  (activity) => activity.map?.summary_polyline
);

test("mapped demo activities use distinct synthetic routes", () => {
  const routes = mappedActivities.map(
    (activity) => activity.map.summary_polyline
  );

  assert.ok(routes.length > 1, "the demo should contain multiple mapped routes");
  assert.equal(new Set(routes).size, routes.length);
  assert.ok(!routes.includes(GOOGLE_EXAMPLE_POLYLINE));
});

test("synthetic demo routes decode to plausible UK coordinates", () => {
  for (const activity of mappedActivities) {
    const coordinates = polyline.decode(activity.map.summary_polyline);

    assert.ok(
      coordinates.length >= 6,
      `${activity.name} should contain enough points to show a route shape`
    );

    for (const [latitude, longitude] of coordinates) {
      assert.ok(Number.isFinite(latitude) && Number.isFinite(longitude));
      assert.ok(
        latitude >= 49 && latitude <= 61,
        `${activity.name} latitude should stay within the synthetic UK envelope`
      );
      assert.ok(
        longitude >= -8.5 && longitude <= 2.5,
        `${activity.name} longitude should stay within the synthetic UK envelope`
      );
    }
  }
});
