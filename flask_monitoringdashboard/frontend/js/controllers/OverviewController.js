export function OverviewController($scope, $http, $location, menuService, endpointService) {
    endpointService.reset();
    menuService.reset('overview');
    $scope.alertShow = false;
    $scope.pypi_version = '';
    $scope.dashboard_version = '';
    $scope.isHits = true;

    $scope.sortBy = 'name';
    $scope.isDesc = true;

    $scope.table = [];
    $scope.selectedItem = 2;

    $scope.searchQuery = '';
    $scope.pageSize = '10';
    $scope.currentPage = 0;
    $scope.blueprints = [''];
    $scope.slectedBlueprint = '';

    $scope.toggleHits = function () {
        $scope.isHits = !$scope.isHits;
    };

    $http.get('api/overview').then(function (response) {
        response.data.forEach((endpoint) => {
            if (!$scope.blueprints.includes(endpoint.blueprint)) {
                $scope.blueprints.push(endpoint.blueprint)
            }
        })
        $scope.table = response.data;
    });

    function ascendingOrder(a, b){
      if ($scope.sortBy === 'last-accessed') {
        return Date.parse(a[$scope.sortBy]) < Date.parse(b[$scope.sortBy]) || a[$scope.sortBy] === null; //null if endpoint was never accessed
        }
      return a[$scope.sortBy] < b[$scope.sortBy];
    }

    function descendingOrder(a, b){
        return ascendingOrder(b, a);
    }
    
    function sortItems(items){
      return $scope.isDesc ? items.sort(descendingOrder) : items.sort(ascendingOrder)
    }

    function getItemsForPage(pageNumber) {
        const start = pageNumber * Number($scope.pageSize);
        const end = (pageNumber + 1) * Number($scope.pageSize);
  
        let items = $scope.table
            .filter(item => item.name.includes($scope.searchQuery));

        if ($scope.slectedBlueprint) {
            items = items.filter(item => item.blueprint===$scope.slectedBlueprint);
        }
    
        return sortItems(items).slice(start, end);
    }

    $scope.changeSortingOrder = function (column) {
        if (column !== $scope.sortBy){
            $scope.isDesc = true;
            $scope.sortBy = column;
            return;
        }
        $scope.isDesc = !$scope.isDesc;
    }

    $scope.getFilteredItems = function () {
        return getItemsForPage($scope.currentPage);
    }

    $scope.getSortArrowClassName = function (column) {
      return {
        'rotate-up': !$scope.isDesc && $scope.sortBy === column,
        'rotate-down': $scope.isDesc && $scope.sortBy === column,
        'text-gray': $scope.sortBy !== column 
      }
    }

    $scope.canGoBack = function () {
        return $scope.currentPage > 0;
    }

    $scope.canGoForward = function () {
        return getItemsForPage($scope.currentPage + 1).length > 0;
    }

    $scope.nextPage = function () {
        $scope.currentPage++;
    }

    $scope.previousPage = function () {
        $scope.currentPage--;
    }


    $scope.go = function (path) {
        $location.path(path);
    };

    $http.get('https://pypi.org/pypi/Flask-MonitoringDashboard/json').then(function (response) {
        $scope.pypi_version = response.data['info']['version'];

        $http.get('api/deploy_details').then(function (response) {
            $scope.dashboard_version = response.data['dashboard-version'];
            $scope.alertShow = !isNewestVersion($scope.pypi_version, $scope.dashboard_version);
        })
    });
}

function isNewestVersion(pypi_version, dashboard_version) {
    let pypi_version_array = pypi_version.split('.');
    let dashboard_version_array = dashboard_version.split('.');
    for (let i = 0; i < 3; i++) {
        if (pypi_version_array[i] > dashboard_version_array[i]) {
            return false;  // using an older version.
        } else if (pypi_version_array[i] < dashboard_version_array[i]){
            return true;  // using a newer version.
        }
    }
    return true;  // using the same version.
}
