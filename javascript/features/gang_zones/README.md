# Gang zones
Las Venturas Playground supports [Gangs](../gangs/), groups of players working together towards
dominance on the server. Each gang member is able to have one or multiple [Houses](../houses/),
which often are located together to form a feeling of coherency.

We now support _gang zones_, which indicates such areas on the map based on the gang's identity
color. This marks the area as being distinctively theirs, and grants them access to ownership of
the area, and thus the ability to manage and change its aesthetics well beyond individual houses.

## Determination of _zone dominance_
Gang zones are created for areas in which a gang has assured _zone dominance_. This is determined
in the following mechanism, which gangs can directly influence:

  1. **Identification of active gang members**. This is done by considering all players on Las
     Venturas Playground who are part of a gang, and have recently been in-game. _Recency_ here
     is influenced by the player's total online time.

  1. **Identification of active gangs**. Each gang which has at least five active gang members
     will be considered active, and is eligible to receive a gang zone.

  1. **Identification of gang area(s)**. A tally will be made of all houses owned by the active
     gang members. Any area where more than 50% active members have a house will be considered
     a gang area. This means that gangs can occupy multiple areas, for example one in each city,
     as long as all enough members participate in this.

  1. ...

The gang zone feature will continue to evaluate these requirements while the server is running,
so players joining a gang and building a house in the gang area(s) will have an immediate effect.

## Appendix

### What constitutes an active gang member?
Gang members are considered to be recently active when:

  1. They have been in-game in the past 6 months, or,
  1. They have been in-game in the past 12 months and have >200 hours of in-game time, or,
  1. They have been in-game in the past 24 months and have >500 hours of in-game time, or,
  1. They have >1000 hours of in-game time.

There are no exceptions for VIP members or administrators. Although they naturally tend to have
spent more time on Las Venturas Playground, this isn't per se recently.

### How exactly are gang areas determined?
We apply a specialized [k-means clustering](https://en.wikipedia.org/wiki/K-means_clustering)
algorithm, implemented in [clustering.js](clustering.js), do determine up to five clusters over
which the gang members' houses are distributed.

For each of those clusters, we then identify the houses that are within a hundred units from
the cluster's mean, to ensure that the houses are truly close together. We then make sure that at
least 50% of the gang's active members are represented in the area. If this is the case, the area
surrounding the cluster will be considered a _gang area_.

There are certain _area size bonuses_ available as well:

  1. At least eight active gang members have a house in the area.

### Appendix: future considerations

  * `ZoneCalculator::computeGangAreas()` could consider different distance requirements depending on
    the member representation factor in the area.
