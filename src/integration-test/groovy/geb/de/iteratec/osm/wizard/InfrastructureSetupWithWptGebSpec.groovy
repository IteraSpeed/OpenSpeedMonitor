package geb.de.iteratec.osm.wizard

import de.iteratec.osm.OsmConfiguration
import de.iteratec.osm.measurement.environment.Location
import de.iteratec.osm.measurement.environment.WebPageTestServer
import de.iteratec.osm.security.User
import geb.CustomUrlGebReportingSpec
import geb.pages.de.iteratec.osm.LandingPage
import geb.pages.de.iteratec.osm.wizards.InfrastructureSetupPage
import grails.gorm.transactions.Rollback
import grails.testing.mixin.integration.Integration
import grails.util.Holders
import spock.lang.Stepwise

@Integration
@Rollback
@Stepwise
class InfrastructureSetupWithWptGebSpec extends CustomUrlGebReportingSpec {

    void "The Setup can be cancelled"() {
        given:
        User.withNewTransaction {
            OsmConfiguration.build()
        }
        to InfrastructureSetupPage
        InfrastructureSetupPage currentPage = page as InfrastructureSetupPage

        when:
        currentPage.cancel.click()

        then:
        at LandingPage
        driver.currentUrl.endsWith("/landing/continueSetup")
    }


    void "User should start with predefined values"() {
        given: "User starts at Infrastructure Page"
        to InfrastructureSetupPage
        InfrastructureSetupPage currentPage = page as InfrastructureSetupPage

        expect: "WebPage test should be selected with all it's defaults and except the api key, all should be disabled"
        currentPage.isWebPageTestServerSelected()
        currentPage.serverName.value() == "www.webpagetest.org"
        currentPage.serverUrl.value() == "http://www.webpagetest.org"
        !currentPage.serverApiKey.value()

        currentPage.serverName.@disabled
        currentPage.serverUrl.@disabled
        !currentPage.isSubmitEnabled()
        !currentPage.serverApiKey.@disabled
        currentPage.hasError(currentPage.serverApiKey)
    }

    void "Entering an API-Key should enable the submit button"() {
        given:
        InfrastructureSetupPage currentPage = page as InfrastructureSetupPage

        when: "an api key is entered"
        currentPage.serverApiKey << "anApiKey"

        then: "the submit button should be enabled and the api key field should't show any errors"
        currentPage.isSubmitEnabled()
        !currentPage.hasError(currentPage.serverApiKey)
    }


    void "Hitting submit should redirect to the landing page"() {
        given: "a mocked wptServerService so we don't actually call webpagetest.org"
        InfrastructureSetupPage currentPage = page as InfrastructureSetupPage
        def wptServerService = Holders.applicationContext.getBean("wptServerService")
        wptServerService.metaClass.tryFetchLocations = { WebPageTestServer server ->
            return [new Location()]
        }


        when: "the submit button was clicked"
        currentPage.submit.click()

        then: "the landingpage should load"
        at LandingPage
    }

    void cleanupSpec() {
        User.withNewTransaction {
            OsmConfiguration.first().delete()
        }
    }
}
